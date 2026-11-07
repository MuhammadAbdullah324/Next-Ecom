import type { Metadata } from "next";
import { requireAdmin } from "@/features/admin/guard";
import { listAdminCategories, textParam } from "@/features/admin/queries";
import { AdminPageHeader, Panel } from "@/components/admin/page-header";
import { PromotionForm } from "@/components/admin/promotion-form";

export const metadata: Metadata = { title: "New banner" };

export default async function NewPromotionPage({ searchParams }: PageProps<"/admin/content/new">) {
  await requireAdmin("/admin/content/new");
  const [categories, sp] = await Promise.all([listAdminCategories(), searchParams]);
  const page = textParam(sp.page);
  return (
    <>
      <AdminPageHeader title="New banner" back={{ href: "/admin/content", label: "Banners & content" }} />
      <Panel>
        <PromotionForm categories={categories} defaults={{ page, placement: page === "all" ? "banner" : undefined }} />
      </Panel>
    </>
  );
}
