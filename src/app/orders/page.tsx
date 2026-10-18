import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireAccount } from "@/features/auth/session";
import { listOrders } from "@/features/orders/queries";
import { describeOrder } from "@/features/orders/status";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = { title: "Your orders" };

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" });

async function OrderList() {
  await requireAccount("/orders");
  const orders = await listOrders();

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <p className="text-lg font-semibold">No orders yet</p>
        <p className="mt-2 text-sm text-muted-foreground">When you place an order, it will show up here.</p>
        <ButtonLink href="/products" className="mt-6">Start shopping</ButtonLink>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border rounded-3xl border bg-card shadow-sm">
      {orders.map((order) => {
        const outcome = describeOrder(order);
        const count = order.items.reduce((n, i) => n + i.quantity, 0);
        return (
          <li key={order.id}>
            <Link href={`/orders/${order.order_number}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-muted">
              <div>
                <p className="font-medium">{order.order_number}</p>
                <p className="text-sm text-muted-foreground">
                  {dateFormat.format(new Date(order.created_at))} · {count} {count === 1 ? "item" : "items"}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant={outcome.tone}>{outcome.label}</Badge>
                <span className="font-medium tabular-nums">{formatMoney(order.total_amount, order.currency)}</span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default function OrdersPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-3xl font-semibold tracking-tight sm:text-4xl">Your orders</h1>
      <Suspense fallback={<Skeleton className="h-64" />}>
        <OrderList />
      </Suspense>
    </div>
  );
}
