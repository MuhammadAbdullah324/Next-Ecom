import Form from "next/form";
import Link from "next/link";
import { getBrands, getListingPage } from "@/features/catalog/queries";
import { listingHref, parseListingParams } from "@/features/catalog/search-params";
import { ProductGrid } from "./product-card";
import { Pagination } from "./pagination";
import { SortSelect } from "./sort-select";
import { FilterFields } from "./filter-panel";
import { buttonVariants } from "@/components/ui/button";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

// Shared PLP body for /products and /category/[slug]. All state is in the URL.
export async function ListingView({
  base,
  searchParams,
  category,
}: {
  base: string;
  searchParams: SearchParams;
  category?: string;
}) {
  const filters = { ...parseListingParams(await searchParams), ...(category ? { category } : {}) };
  const [result, brands] = await Promise.all([getListingPage(filters), getBrands(category)]);
  const filtered = filters.brand.length > 0 || filters.min != null || filters.max != null || filters.inStock || !!filters.q;
  const clearHref = listingHref(base, { q: filters.q, sort: filters.sort });

  return (
    <Form action={base} className="mt-6 grid gap-8 lg:grid-cols-[15rem_1fr]">
      {filters.q ? <input type="hidden" name="q" value={filters.q} /> : null}
      {!category && filters.category ? <input type="hidden" name="category" value={filters.category} /> : null}

      <aside aria-label="Filters">
        <details className="rounded-lg border bg-card p-4 lg:hidden">
          <summary className="cursor-pointer text-sm font-semibold">Filters</summary>
          <div className="mt-4">
            <FilterFields filters={filters} brands={brands} />
            <button type="submit" className={buttonVariants({ className: "mt-6 w-full" })}>Apply filters</button>
          </div>
        </details>
        <div className="sticky top-36 hidden lg:block">
          <FilterFields filters={filters} brands={brands} />
          <div className="mt-6 flex gap-2">
            <button type="submit" className={buttonVariants({ size: "sm", className: "flex-1" })}>Apply</button>
            {filtered ? <Link href={clearHref} className={buttonVariants({ variant: "ghost", size: "sm" })}>Clear</Link> : null}
          </div>
        </div>
      </aside>

      <section aria-labelledby="results-heading">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p id="results-heading" className="text-sm text-muted-foreground" aria-live="polite">
            {result.total} {result.total === 1 ? "product" : "products"}
            {filters.q ? <> for “{filters.q}”</> : null}
          </p>
          <SortSelect value={filters.sort} />
        </div>

        {result.products.length === 0 ? (
          <div className="rounded-xl bg-muted px-6 py-20 text-center">
            <p className="text-xl font-semibold">No products match</p>
            <p className="mt-2 text-sm text-muted-foreground">Try removing a filter or searching for something else.</p>
            <Link href={filtered ? listingHref(base, {}) : "/products"} className={buttonVariants({ variant: "outline", className: "mt-6" })}>
              {filtered ? "Clear filters" : "See all products"}
            </Link>
          </div>
        ) : (
          <>
            <ProductGrid products={result.products} />
            <Pagination base={base} filters={filters} pageCount={result.pageCount} />
          </>
        )}
      </section>
    </Form>
  );
}
