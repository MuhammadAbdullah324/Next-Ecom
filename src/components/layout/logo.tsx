import Link from "next/link";

// Wordmark with a little needle-and-thread loop.
export function Logo() {
  return (
    <Link href="/" className="group inline-flex items-center gap-2 rounded-full" aria-label="Tiny Threads home">
      <span aria-hidden className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm transition-transform group-hover:-rotate-12">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M5 19 19 5" />
          <path d="M16 5h3v3" />
          <path d="M7 9c-2 0-3 1.5-3 3s1.5 3 3.5 2.5S11 12 12.5 12s2.5 1.5 2 3.5S12 19 10 18" />
        </svg>
      </span>
      <span className="font-heading text-xl font-semibold tracking-tight">
        Tiny<span className="text-primary">Threads</span>
      </span>
    </Link>
  );
}
