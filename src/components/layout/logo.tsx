import Link from "next/link";

// Plain wordmark; the small dot echoes the sale accent.
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-baseline rounded-sm text-lg font-semibold tracking-tight sm:text-xl ${className}`} aria-label="Tiny Threads home">
      tiny threads<span aria-hidden className="text-sale">.</span>
    </Link>
  );
}
