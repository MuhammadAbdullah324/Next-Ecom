import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAdmin } from "@/features/admin/guard";
import { AdminPageHeader, Panel, AdminSkeleton } from "@/components/admin/page-header";
import { CategoryForm } from "@/components/admin/category-form";

export const metadata: Metadata = { title: "New category" };

async function NewCategoryPageContent() {
  await requireAdmin("/admin/categories/new");
  return (
    <>
      <AdminPageHeader title="New category" back={{ href: "/admin/categories", label: "Categories" }} />
      <Panel>
        <CategoryForm />
      </Panel>
    </>
  );
}

// The Suspense boundary sits inside the page so switching between admin pages shows the
// skeleton at once while live data streams in (an instant navigation).
export default function NewCategoryPage() {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <NewCategoryPageContent />
    </Suspense>
  );
}
