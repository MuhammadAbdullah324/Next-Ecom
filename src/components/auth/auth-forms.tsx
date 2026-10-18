"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  requestPasswordReset,
  signIn,
  signInWithGoogle,
  signUp,
  updatePassword,
  type AuthFormState,
} from "@/features/auth/actions";
import { Alert } from "@/components/ui/alert";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { buttonVariants } from "@/components/ui/button";

function Messages({ state }: { state: AuthFormState }) {
  if (state.error) return <Alert variant="destructive">{state.error}</Alert>;
  if (state.message) return <Alert variant="success">{state.message}</Alert>;
  return null;
}

export function GoogleButton({ next }: { next: string }) {
  return (
    <form action={signInWithGoogle}>
      <input type="hidden" name="next" value={next} />
      <button type="submit" className={buttonVariants({ variant: "outline", size: "lg", className: "w-full" })}>
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
          <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.2 14.6 2.2 12 2.2 6.6 2.2 2.2 6.6 2.2 12s4.4 9.8 9.8 9.8c5.7 0 9.4-4 9.4-9.6 0-.6-.1-1.1-.2-1.6H12z" />
        </svg>
        Continue with Google
      </button>
    </form>
  );
}

export function SignInForm({ next }: { next: string }) {
  const [state, action] = useActionState(signIn, {});
  return (
    <form action={action} className="space-y-4" noValidate>
      <Messages state={state} />
      <input type="hidden" name="next" value={next} />
      <Field label="Email" name="email" type="email" autoComplete="email" required defaultValue={state.email} />
      <Field label="Password" name="password" type="password" autoComplete="current-password" required />
      <div className="text-right text-sm">
        <Link href="/forgot-password" className="underline underline-offset-4 hover:text-muted-foreground">Forgot password?</Link>
      </div>
      <SubmitButton size="lg" className="w-full" pendingLabel="Signing in…">Sign in</SubmitButton>
    </form>
  );
}

export function SignUpForm({ next }: { next: string }) {
  const [state, action] = useActionState(signUp, {});
  if (state.message) return <Alert variant="success" title="Check your email">{state.message}</Alert>;
  return (
    <form action={action} className="space-y-4" noValidate>
      <Messages state={state} />
      <input type="hidden" name="next" value={next} />
      <Field label="Full name" name="fullName" autoComplete="name" required />
      <Field label="Email" name="email" type="email" autoComplete="email" required defaultValue={state.email} />
      <Field label="Password" name="password" type="password" autoComplete="new-password" required minLength={8} hint="At least 8 characters." />
      <SubmitButton size="lg" className="w-full" pendingLabel="Creating account…">Create account</SubmitButton>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action] = useActionState(requestPasswordReset, {});
  return (
    <form action={action} className="space-y-4" noValidate>
      <Messages state={state} />
      <Field label="Email" name="email" type="email" autoComplete="email" required />
      <SubmitButton size="lg" className="w-full" pendingLabel="Sending…">Send reset link</SubmitButton>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, action] = useActionState(updatePassword, {});
  return (
    <form action={action} className="space-y-4" noValidate>
      <Messages state={state} />
      <Field label="New password" name="password" type="password" autoComplete="new-password" required minLength={8} />
      <Field label="Confirm new password" name="confirm" type="password" autoComplete="new-password" required minLength={8} />
      <SubmitButton size="lg" className="w-full" pendingLabel="Saving…">Save new password</SubmitButton>
    </form>
  );
}
