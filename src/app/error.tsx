"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-3xl font-bold tracking-tight">Something went wrong</h1>
      <p className="mt-3 text-ink-soft">We couldn&apos;t load this page. Please try again in a moment.</p>
      <Button onClick={reset} className="mt-8">Try again</Button>
    </div>
  );
}
