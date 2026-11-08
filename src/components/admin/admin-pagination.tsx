import Link from "next/link";
import { cn } from "@/lib/utils";

// Prev / next links that keep the other query parameters.
export function AdminPagination({ base, params, page, pageCount, total }: { base: string; params: Record<string, string | undefined>; page: number; pageCount: number; total: number }) {
  if (pageCount <= 1) return <p className="mt-4 text-sm text-muted-foreground">{total} total</p>;
  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `${base}?${qs}` : base;
  };
  const link = "inline-flex min-h-10 items-center rounded-md border bg-card px-3.5 text-sm font-medium hover:border-foreground";
  return (
    <nav aria-label="Pagination" className="mt-4 flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">
        Page {page} of {pageCount} · {total} total
      </span>
      <span className="flex gap-2">
        {page > 1 ? <Link href={href(page - 1)} className={link} rel="prev">Previous</Link> : <span className={cn(link, "pointer-events-none opacity-40")}>Previous</span>}
        {page < pageCount ? <Link href={href(page + 1)} className={link} rel="next">Next</Link> : <span className={cn(link, "pointer-events-none opacity-40")}>Next</span>}
      </span>
    </nav>
  );
}
