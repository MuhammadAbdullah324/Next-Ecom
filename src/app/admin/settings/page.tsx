import type { Metadata } from "next";
import { requireAdmin } from "@/features/admin/guard";
import { getAdminSettings } from "@/features/admin/queries";
import { AdminPageHeader, Panel } from "@/components/admin/page-header";
import { ShippingMethods, StoreSettingsForm } from "@/components/admin/settings-forms";

export const metadata: Metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
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
