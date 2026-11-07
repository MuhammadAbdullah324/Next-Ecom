import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser, type CurrentUser } from "@/features/auth/session";
import { createClient } from "@/lib/supabase/server";

// Reads the role from profiles. The database repeats this check (is_admin() in RLS and in the
// admin_* functions), so a bug here can hide a page but never leak or change data.
export const getIsAdmin = cache(async (): Promise<boolean> => {
  const user = await getCurrentUser();
  if (!user || user.isGuest) return false;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return data?.role === "admin";
});

// For admin pages: sends signed-out visitors to sign in, and shows a 404 to everyone else.
export async function requireAdmin(next = "/admin"): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user || user.isGuest) redirect(`/sign-in?next=${encodeURIComponent(next)}`);
  if (!(await getIsAdmin())) notFound();
  return user;
}

// For admin Server Actions: returns a client that acts as the admin, or throws.
export async function adminClient() {
  const user = await getCurrentUser();
  if (!user || user.isGuest || !(await getIsAdmin())) throw new Error("Only store admins can do that.");
  return { supabase: await createClient(), user };
}
