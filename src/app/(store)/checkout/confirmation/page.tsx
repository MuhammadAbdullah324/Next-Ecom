import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { getCurrentUser } from "@/features/auth/session";
import { getOrderById } from "@/features/orders/queries";
import { recordCheckoutSession } from "@/features/payments/fulfillment";
import { getStripe } from "@/features/payments/stripe";
import { OrderDetails } from "@/components/orders/order-details";
import { OutcomeBanner } from "@/components/orders/outcome-banner";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Order confirmation", robots: { index: false } };

async function Confirmation({ searchParams }: { searchParams: PageProps<"/checkout/confirmation">["searchParams"] }) {
  await connection(); // talks to Stripe, so always at request time
  const { session_id } = await searchParams;
  if (typeof session_id !== "string" || !session_id.startsWith("cs_")) notFound();

  const session = await getStripe().checkout.sessions.retrieve(session_id).catch(() => null);
  const orderId = session?.metadata?.order_id ?? session?.client_reference_id;
  if (!session || !orderId) notFound();

  // RLS: only the shopper who placed the order can see it.
  const before = await getOrderById(orderId);
  if (!before) notFound();

  // Don't wait for the webhook: confirm now if Stripe says it's paid. Safe to repeat.
  if (before.status === "pending" && session.payment_status === "paid") await recordCheckoutSession(session);
  const order = (await getOrderById(orderId)) ?? before;
  const user = await getCurrentUser();

  return (
    <div className="space-y-8">
      <OutcomeBanner order={order} isGuest={user?.isGuest ?? true} />
      <OrderDetails order={order} />
    </div>
  );
}

export default function ConfirmationPage({ searchParams }: PageProps<"/checkout/confirmation">) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Suspense fallback={<div className="space-y-8"><Skeleton className="h-36" /><Skeleton className="h-80" /></div>}>
        <Confirmation searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
