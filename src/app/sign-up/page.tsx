import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { safeNext } from "@/features/auth/redirects";
import { AuthCard, Divider } from "@/components/auth/auth-card";
import { GoogleButton, SignUpForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Create an account" };

async function Content({ searchParams }: { searchParams: PageProps<"/sign-up">["searchParams"] }) {
  const next = safeNext((await searchParams).next);
  return (
    <AuthCard
      title="Create an account"
      subtitle="Save addresses, check out faster and see your order history."
      footer={<>Already have an account? <Link href={`/sign-in?next=${encodeURIComponent(next)}`} className="font-medium text-primary hover:underline">Sign in</Link></>}
    >
      <GoogleButton next={next} />
      <Divider />
      <SignUpForm next={next} />
    </AuthCard>
  );
}

export default function SignUpPage({ searchParams }: PageProps<"/sign-up">) {
  return (
    <Suspense>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}
