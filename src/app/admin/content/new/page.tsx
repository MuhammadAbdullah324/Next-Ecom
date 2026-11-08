import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAdmin } from "@/features/admin/guard";
import { listAdminCategories, textParam } from "@/features/admin/queries";
import { AdminPageHeader, Panel, AdminSkeleton } from "@/components/admin/page-header";
import { PromotionForm } from "@/components/admin/promotion-form";

export const metadata: Metadata = { title: "New banner" };

async function NewPromotionPageContent({ searchParams }: PageProps<"/admin/content/new">) {
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

// The Suspense boundary sits inside the page so switching between admin pages shows the
// skeleton at once while live data streams in (an instant navigation).
export default function NewPromotionPage(props: PageProps<"/admin/content/new">) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <NewPromotionPageContent {...props} />
    </Suspense>
  );
}
