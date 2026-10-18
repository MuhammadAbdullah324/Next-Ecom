import Link from "next/link";
import clsx from "clsx";
import { listingHref, type ListingFilters } from "@/features/catalog/search-params";

function pagesToShow(page: number, pageCount: number) {
  const pages = new Set([1, pageCount, page - 1, page, page + 1]);
  return [...pages].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b);
}

export function Pagination({ base, filters, pageCount }: { base: string; filters: ListingFilters; pageCount: number }) {
  if (pageCount <= 1) return null;
  const page = Math.min(filters.page, pageCount);
  const href = (p: number) => listingHref(base, { ...filters, page: p });
  const pages = pagesToShow(page, pageCount);
  const linkClass = "inline-flex min-h-11 min-w-11 items-center justify-center rounded-md px-3 text-sm";

  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-1">
      {page > 1 ? (
        <Link href={href(page - 1)} className={clsx(linkClass, "font-semibold hover:bg-muted")} rel="prev">
          Previous
        </Link>
      ) : null}
      {pages.map((p, i) => (
        <span key={p} className="flex items-center">
          {i > 0 && p - pages[i - 1] > 1 ? <span className="px-1 text-muted-foreground" aria-hidden="true">…</span> : null}
          <Link
            href={href(p)}
            aria-current={p === page ? "page" : undefined}
            aria-label={`Page ${p}`}
            className={clsx(linkClass, p === page ? "bg-primary font-semibold text-primary-foreground" : "font-medium hover:bg-muted")}
          >
            {p}
          </Link>
        </span>
      ))}
      {page < pageCount ? (
        <Link href={href(page + 1)} className={clsx(linkClass, "font-semibold hover:bg-muted")} rel="next">
          Next
        </Link>
      ) : null}
    </nav>
  );
}
