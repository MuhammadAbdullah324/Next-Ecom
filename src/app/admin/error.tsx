"use client";

import { Button } from "@/components/ui/button";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="rounded-xl border bg-card px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        {error.message?.startsWith("Only store admins") ? error.message : "This page couldn't load. If you just ran the admin migration, refresh; otherwise try again in a moment."}
      </p>
      <Button onClick={reset} className="mt-6">Try again</Button>
    </div>
  );
}
