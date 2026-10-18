"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// While a payment is still being confirmed, re-render the page every few seconds.
export function AutoRefresh({ everyMs = 3000, maxTries = 20 }: { everyMs?: number; maxTries?: number }) {
  const router = useRouter();
  useEffect(() => {
    let tries = 0;
    const id = setInterval(() => {
      tries += 1;
      if (tries > maxTries) clearInterval(id);
      else router.refresh();
    }, everyMs);
    return () => clearInterval(id);
  }, [router, everyMs, maxTries]);
  return null;
}
