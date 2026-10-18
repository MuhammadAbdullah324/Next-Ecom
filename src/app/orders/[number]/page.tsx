import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getCurrentUser } from "@/features/auth/session";
import { getOrderByNumber } from "@/features/orders/queries";
import { OrderDetails } from "@/components/orders/order-details";
import { OutcomeBanner } from "@/components/orders/outcome-banner";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Order details", robots: { index: false } };

async function Order({ params }: { params: PageProps<"/orders/[number]">["params"] }) {
  const { number } = await params;
  const [order, user] = await Promise.all([getOrderByNumber(decodeURIComponent(number)), getCurrentUser()]);
  if (!order) notFound(); // also when it belongs to someone else (RLS)

  return (
    <div className="space-y-8">
      {user && !user.isGuest ? (
        <Link href="/orders" className="text-sm text-muted hover:text-ink">← All orders</Link>
      ) : null}
      <OutcomeBanner order={order} isGuest={user?.isGuest ?? true} />
      <OrderDetails order={order} />
    </div>
  );
}

export default function OrderPage({ params }: PageProps<"/orders/[number]">) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Order params={params} />
      </Suspense>
    </div>
  );
}
