import type { Metadata } from "next";
import { requireAdmin } from "@/features/admin/guard";
import { listAdminCategories } from "@/features/admin/queries";
import { AdminPageHeader, EmptyState, Panel } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  await requireAdmin("/admin/products/new");
  const categories = await listAdminCategories();
  return (
    <>
      <AdminPageHeader title="New product" back={{ href: "/admin/products", label: "Products" }} />
      {categories.length === 0 ? (
        <EmptyState title="Add a category first" action={<ButtonLink href="/admin/categories/new">New category</ButtonLink>}>
          Every product belongs to a category.
        </EmptyState>
      ) : (
        <Panel>
          <ProductForm categories={categories} />
        </Panel>
      )}
    </>
  );
}
