import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAdmin } from "@/features/admin/guard";
import { listAdminCategories } from "@/features/admin/queries";
import { AdminPageHeader, EmptyState, Panel, AdminSkeleton } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "New product" };

async function NewProductPageContent() {
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

// The Suspense boundary sits inside the page so switching between admin pages shows the
// skeleton at once while live data streams in (an instant navigation).
export default function NewProductPage() {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <NewProductPageContent />
    </Suspense>
  );
}
