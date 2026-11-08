import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { requireAdmin } from "@/features/admin/guard";
import { listAdminCategories, listAdminProducts, pageParam, textParam } from "@/features/admin/queries";
import { getStoreSettings } from "@/features/checkout/queries";
import { formatMoney } from "@/lib/money";
import { AdminPageHeader, EmptyState, AdminSkeleton } from "@/components/admin/page-header";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const metadata: Metadata = { title: "Products" };

async function AdminProductsPageContent({ searchParams }: PageProps<"/admin/products">) {
  await requireAdmin("/admin/products");
  const sp = await searchParams;
  const filters = { q: textParam(sp.q), category: textParam(sp.category), status: textParam(sp.status), page: pageParam(sp.page) };
  const [{ products, total, pageCount }, categories, settings] = await Promise.all([listAdminProducts(filters), listAdminCategories(), getStoreSettings()]);
  const filtered = !!(filters.q || filters.category || filters.status);

  return (
    <>
      <AdminPageHeader
        title="Products"
        description="Add, edit and hide products. Changes show in the store right away."
        actions={<ButtonLink href="/admin/products/new"><Plus aria-hidden /> New product</ButtonLink>}
      />
      {sp.deleted ? <Alert variant="success" className="mb-4">Product deleted.</Alert> : null}

      <form className="mb-4 flex flex-wrap items-end gap-2" role="search">
        <div className="relative min-w-56 flex-1">
          <label htmlFor="product-q" className="sr-only">Search products</label>
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="product-q" name="q" type="search" defaultValue={filters.q} placeholder="Search name, slug or brand" className="min-h-10 pl-9 text-sm" />
        </div>
        <label htmlFor="product-category" className="sr-only">Category</label>
        <NativeSelect id="product-category" name="category" defaultValue={filters.category ?? ""}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </NativeSelect>
        <label htmlFor="product-status" className="sr-only">Status</label>
        <NativeSelect id="product-status" name="status" defaultValue={filters.status ?? ""}>
          <option value="">Any status</option>
          <option value="active">Visible</option>
          <option value="hidden">Hidden</option>
          <option value="featured">Featured</option>
        </NativeSelect>
        <Button type="submit" variant="outline" size="sm" className="min-h-10">Filter</Button>
        {filtered ? <Link href="/admin/products" className="px-2 text-sm underline underline-offset-4">Clear</Link> : null}
      </form>

      {products.length === 0 ? (
        <EmptyState
          title={filtered ? "No products match" : "No products yet"}
          action={filtered ? undefined : <ButtonLink href="/admin/products/new"><Plus aria-hidden /> Add your first product</ButtonLink>}
        >
          {filtered ? "Try a different search or clear the filters." : "Products you add here appear in the store."}
        </EmptyState>
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id} className="relative">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="size-11 shrink-0 overflow-hidden rounded-md border bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnails */}
                        {p.image_url ? <img src={p.image_url} alt="" className="size-full object-cover" loading="lazy" /> : null}
                      </div>
                      <div className="min-w-0">
                        <Link href={`/admin/products/${p.id}`} className="font-medium after:absolute after:inset-0 hover:underline">{p.name}</Link>
                        <p className="truncate text-xs text-muted-foreground">{p.brand ?? p.slug}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">{p.category_name}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(p.price, settings.currency)}
                    {p.compare_at_price ? <span className="block text-xs text-muted-foreground line-through">{formatMoney(p.compare_at_price, settings.currency)}</span> : null}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    <span className={p.stock === 0 ? "font-semibold text-danger" : p.stock <= 5 ? "font-semibold text-warning" : ""}>{p.stock}</span>
                    <span className="block text-xs text-muted-foreground">{p.variant_count} {p.variant_count === 1 ? "variant" : "variants"}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {p.is_active ? <Badge variant="success">Visible</Badge> : <Badge variant="neutral">Hidden</Badge>}
                      {p.is_featured ? <Badge variant="brand">Featured</Badge> : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <AdminPagination base="/admin/products" params={{ q: filters.q, category: filters.category, status: filters.status }} page={filters.page} pageCount={pageCount} total={total} />
    </>
  );
}

// The Suspense boundary sits inside the page so switching between admin pages shows the
// skeleton at once while live data streams in (an instant navigation).
export default function AdminProductsPage(props: PageProps<"/admin/products">) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <AdminProductsPageContent {...props} />
    </Suspense>
  );
}
