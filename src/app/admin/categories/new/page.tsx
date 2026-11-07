import type { Metadata } from "next";
import { requireAdmin } from "@/features/admin/guard";
import { AdminPageHeader, Panel } from "@/components/admin/page-header";
import { CategoryForm } from "@/components/admin/category-form";

export const metadata: Metadata = { title: "New category" };

export default async function NewCategoryPage() {
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
