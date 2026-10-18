import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentUser } from "@/features/auth/session";
import { getCart } from "@/features/cart/queries";
import { getSavedAddresses, getShippingMethods, getStoreSettings } from "@/features/checkout/queries";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

async function CheckoutContents() {
  const user = await getCurrentUser();
  const cart = await getCart();
  if (!user || cart.lines.length === 0 || cart.problems > 0) redirect("/cart");

  const [addresses, methods, settings] = await Promise.all([
    user.isGuest ? Promise.resolve([]) : getSavedAddresses(),
    getShippingMethods(),
    getStoreSettings(),
  ]);

  return (
    <CheckoutForm
      isGuest={user.isGuest}
      email={user.email}
      addresses={addresses}
      methods={methods}
      lines={cart.lines}
      subtotal={cart.subtotal}
      currency={settings.currency}
      taxRate={settings.taxRate}
    />
  );
}

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">Checkout</h1>
      <Suspense fallback={<div className="grid gap-10 lg:grid-cols-[1fr_24rem]"><Skeleton className="h-96" /><Skeleton className="h-80" /></div>}>
        <CheckoutContents />
      </Suspense>
    </div>
  );
}
