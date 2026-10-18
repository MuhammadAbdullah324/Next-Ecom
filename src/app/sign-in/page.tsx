import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { safeNext } from "@/features/auth/redirects";
import { AuthCard, Divider } from "@/components/auth/auth-card";
import { GoogleButton, SignInForm } from "@/components/auth/auth-forms";
import { Alert } from "@/components/ui/alert";

export const metadata: Metadata = { title: "Sign in" };

const errors: Record<string, string> = {
  link: "That sign-in link is invalid or has expired. Please try again.",
  google: "We couldn't connect to Google. Please try again.",
};

async function Content({ searchParams }: { searchParams: PageProps<"/sign-in">["searchParams"] }) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  const error = typeof sp.error === "string" ? errors[sp.error] : undefined;
  return (
    <AuthCard
      title="Sign in"
      subtitle="Your cart comes with you when you sign in."
      footer={<>New here? <Link href={`/sign-up?next=${encodeURIComponent(next)}`} className="font-medium underline underline-offset-4 hover:text-muted-foreground">Create an account</Link></>}
    >
      {error ? <Alert variant="destructive">{error}</Alert> : null}
      <GoogleButton next={next} />
      <Divider />
      <SignInForm next={next} />
    </AuthCard>
  );
}

export default function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  return (
    <Suspense>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}
