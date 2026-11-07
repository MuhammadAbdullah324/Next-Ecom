import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { requireAdmin } from "@/features/admin/guard";
import { listAdminCategories } from "@/features/admin/queries";
import { deleteCategory } from "@/features/admin/catalog-actions";
import { AdminPageHeader, Panel } from "@/components/admin/page-header";
import { CategoryForm } from "@/components/admin/category-form";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Edit category" };

export default async function EditCategoryPage({ params, searchParams }: PageProps<"/admin/categories/[id]">) {
  const { id } = await params;
  await requireAdmin(`/admin/categories/${id}`);
  const [categories, sp] = await Promise.all([listAdminCategories(), searchParams]);
  const category = categories.find((c) => c.id === id);
  if (!category) notFound();

  return (
    <>
      <AdminPageHeader
        title={category.name}
        back={{ href: "/admin/categories", label: "Categories" }}
        actions={<ButtonLink href={`/admin/products?category=${category.slug}`} variant="outline" size="sm">View its {category.product_count} products</ButtonLink>}
      />
      {sp.error === "in-use" ? (
        <Alert variant="destructive" className="mb-4">This category still has products. Move them to another category or delete them first, or hide the category instead.</Alert>
      ) : null}
      <div className="grid gap-6">
        <Panel>
          <CategoryForm category={category} />
        </Panel>
        <Panel title="Delete category">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">Only empty categories can be deleted. Banners placed on this category page are deleted with it.</p>
            <form action={deleteCategory}>
              <input type="hidden" name="id" value={category.id} />
              <ConfirmButton variant="destructive" size="sm" disabled={category.product_count > 0} pendingLabel="Deleting…" message={`Delete ${category.name}?`}>
                <Trash2 aria-hidden /> Delete
              </ConfirmButton>
            </form>
          </div>
        </Panel>
      </div>
    </>
  );
}
