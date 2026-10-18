"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { publicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { mergeGuestInto, mergeRememberedGuest, rememberGuestForMerge } from "./guest";
import { safeNext } from "./redirects";

export type AuthFormState = { error?: string; message?: string; email?: string };

const email = z.email("Enter a valid email address.").trim().toLowerCase();
const password = z.string().min(8, "Use at least 8 characters for your password.").max(72);

function firstIssue(error: z.ZodError) {
  return error.issues[0]?.message ?? "Check the form and try again.";
}

function callbackUrl(next: string) {
  return `${publicEnv.NEXT_PUBLIC_SITE_URL}/auth/callback?next=${encodeURIComponent(next)}`;
}

async function currentGuestId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.is_anonymous ? user.id : null;
}

export async function signIn(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = z.object({ email, password: z.string().min(1, "Enter your password.") }).safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  const typedEmail = String(formData.get("email") ?? "");
  if (!parsed.success) return { error: firstIssue(parsed.error), email: typedEmail };

  const supabase = await createClient();
  const guestId = await currentGuestId(supabase);
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) {
    const unconfirmed = error?.code === "email_not_confirmed";
    return {
      error: unconfirmed ? "Confirm your email first. Check your inbox for the link." : "Email or password is incorrect.",
      email: typedEmail,
    };
  }

  await mergeGuestInto(guestId, data.user.id);
  redirect(safeNext(formData.get("next")));
}

export async function signUp(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = z
    .object({ fullName: z.string().trim().min(1, "Enter your name.").max(100), email, password })
    .safeParse({ fullName: formData.get("fullName"), email: formData.get("email"), password: formData.get("password") });
  const typedEmail = String(formData.get("email") ?? "");
  if (!parsed.success) return { error: firstIssue(parsed.error), email: typedEmail };

  const next = safeNext(formData.get("next"));
  const supabase = await createClient();
  const guestId = await currentGuestId(supabase);
  if (guestId) await rememberGuestForMerge(guestId);

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { full_name: parsed.data.fullName }, emailRedirectTo: callbackUrl(next) },
  });
  if (error) {
    const taken = error.code === "user_already_exists" || error.code === "email_exists";
    return { error: taken ? "An account with this email already exists. Sign in instead." : error.message, email: typedEmail };
  }

  // With email confirmation off, Supabase signs the user in straight away.
  if (data.session && data.user) {
    await mergeRememberedGuest(data.user.id);
    redirect(next);
  }
  return { message: `We sent a confirmation link to ${parsed.data.email}. Open it to finish creating your account.` };
}

export async function signInWithGoogle(formData: FormData) {
  const next = safeNext(formData.get("next"));
  const supabase = await createClient();
  const guestId = await currentGuestId(supabase);
  if (guestId) await rememberGuestForMerge(guestId);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callbackUrl(next) },
  });
  if (error || !data.url) redirect(`/sign-in?error=google&next=${encodeURIComponent(next)}`);
  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function requestPasswordReset(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = email.safeParse(formData.get("email"));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data, { redirectTo: callbackUrl("/reset-password") });
  // Same answer whether or not the account exists, so emails can't be probed.
  return { message: `If an account exists for ${parsed.data}, we sent a link to reset the password.` };
}

export async function updatePassword(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = password.safeParse(formData.get("password"));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  if (formData.get("password") !== formData.get("confirm")) return { error: "The two passwords don't match." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data });
  if (error) return { error: "Your reset link has expired. Request a new one." };
  redirect("/account?updated=password");
}
