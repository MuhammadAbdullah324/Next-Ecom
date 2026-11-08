import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Reset your password"
      subtitle="Enter your email and we'll send you a link to choose a new password."
      footer={<Link href="/sign-in" className="font-medium underline underline-offset-4 hover:text-muted-foreground">Back to sign in</Link>}
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
