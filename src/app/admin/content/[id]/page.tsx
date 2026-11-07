import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { z } from "zod";
import { requireAdmin } from "@/features/admin/guard";
import { getAdminPromotion, listAdminCategories } from "@/features/admin/queries";
import { deletePromotion } from "@/features/admin/store-actions";
import { AdminPageHeader, Panel } from "@/components/admin/page-header";
import { PromotionForm } from "@/components/admin/promotion-form";
import { ConfirmButton } from "@/components/admin/confirm-button";

export const metadata: Metadata = { title: "Edit banner" };

export default async function EditPromotionPage({ params }: PageProps<"/admin/content/[id]">) {
  const { id } = await params;
  await requireAdmin(`/admin/content/${id}`);
  if (!z.uuid().safeParse(id).success) notFound();
  const [promotion, categories] = await Promise.all([getAdminPromotion(id), listAdminCategories()]);
  if (!promotion) notFound();
  return (
    <>
      <AdminPageHeader title={promotion.title} back={{ href: "/admin/content", label: "Banners & content" }} />
      <div className="grid gap-6">
        <Panel>
          <PromotionForm promotion={promotion} categories={categories} />
        </Panel>
        <Panel title="Delete">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">To take it down for a while, untick Live instead.</p>
            <form action={deletePromotion}>
              <input type="hidden" name="id" value={promotion.id} />
              <ConfirmButton variant="destructive" size="sm" pendingLabel="Deleting…" message="Delete this banner?">
                <Trash2 aria-hidden /> Delete
              </ConfirmButton>
            </form>
          </div>
        </Panel>
      </div>
    </>
  );
}
