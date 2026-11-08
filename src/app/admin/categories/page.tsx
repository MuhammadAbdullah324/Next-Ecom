import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/features/admin/guard";
import { listAdminCategories } from "@/features/admin/queries";
import { AdminPageHeader, EmptyState } from "@/components/admin/page-header";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Categories" };

export default async function AdminCategoriesPage({ searchParams }: PageProps<"/admin/categories">) {
  await requireAdmin("/admin/categories");
  const [categories, sp] = await Promise.all([listAdminCategories(), searchParams]);
  return (
    <>
      <AdminPageHeader
        title="Categories"
        description="The store menu and category pages are built from these."
        actions={<ButtonLink href="/admin/categories/new"><Plus aria-hidden /> New category</ButtonLink>}
      />
      {sp.created ? <Alert variant="success" className="mb-4">Category created.</Alert> : null}
      {sp.deleted ? <Alert variant="success" className="mb-4">Category deleted.</Alert> : null}
      {categories.length === 0 ? (
        <EmptyState title="No categories yet" action={<ButtonLink href="/admin/categories/new">New category</ButtonLink>} />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <li key={c.id} className="relative overflow-hidden rounded-xl border bg-card">
              <div className="aspect-[16/9] bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnails */}
                {c.image_url ? <img src={c.image_url} alt="" className="size-full object-cover" loading="lazy" /> : null}
              </div>
              <div className="flex items-start justify-between gap-3 p-4">
                <div>
                  <Link href={`/admin/categories/${c.id}`} className="font-semibold after:absolute after:inset-0 hover:underline">{c.name}</Link>
                  <p className="text-sm text-muted-foreground">/{c.slug} · {c.product_count} {c.product_count === 1 ? "product" : "products"}</p>
                </div>
                {c.is_active ? <Badge variant="success">Visible</Badge> : <Badge variant="neutral">Hidden</Badge>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
