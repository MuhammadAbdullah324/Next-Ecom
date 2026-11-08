import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAdmin } from "@/features/admin/guard";
import { getAdminSettings } from "@/features/admin/queries";
import { AdminPageHeader, Panel, AdminSkeleton } from "@/components/admin/page-header";
import { ShippingMethods, StoreSettingsForm } from "@/components/admin/settings-forms";

export const metadata: Metadata = { title: "Settings" };

async function AdminSettingsPageContent() {
  await requireAdmin("/admin/settings");
  const settings = await getAdminSettings();
  return (
    <>
      <AdminPageHeader title="Settings" />
      <div className="grid gap-6">
        <Panel title="Store">
          <StoreSettingsForm storeName={settings.storeName} taxRate={settings.taxRate} currency={settings.currency} />
        </Panel>
        <Panel title="Delivery methods" description="Shoppers choose one at checkout. Turn a method off rather than deleting it, so past orders keep their link.">
          <ShippingMethods methods={settings.shipping} />
        </Panel>
      </div>
    </>
  );
}

// The Suspense boundary sits inside the page so switching between admin pages shows the
// skeleton at once while live data streams in (an instant navigation).
export default function AdminSettingsPage() {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <AdminSettingsPageContent />
    </Suspense>
  );
}
