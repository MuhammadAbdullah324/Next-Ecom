import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { z } from "zod";
import { requireAdmin } from "@/features/admin/guard";
import { getAdminOrder } from "@/features/admin/queries";
import { formatMoney } from "@/lib/money";
import { AdminPageHeader, Panel } from "@/components/admin/page-header";
import { CancelOrderForm, OrderStatusForm } from "@/components/admin/order-actions";
import { OrderBadge } from "@/components/admin/order-badge";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Order" };

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });
const fmt = (d: string | null) => (d ? `${dateFormat.format(new Date(d))} UTC` : "—");

const CANCEL_REASONS: Record<string, string> = {
  customer_canceled: "Customer left the payment page",
  payment_failed: "Payment failed",
  expired: "Payment window expired",
  superseded: "Replaced by a newer checkout",
  admin: "Canceled by an admin",
};

const STEPS = ["confirmed", "processing", "shipped", "delivered"] as const;

export default async function AdminOrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  const { id } = await params;
  await requireAdmin(`/admin/orders/${id}`);
  if (!z.uuid().safeParse(id).success) notFound();
  const order = await getAdminOrder(id);
  if (!order) notFound();

  const money = (n: number) => formatMoney(n, order.currency);
  const a = order.shipping_address;
  const paid = order.payment_status === "paid";
  const stepIndex = STEPS.indexOf(order.status as (typeof STEPS)[number]);

  return (
    <>
      <AdminPageHeader
        title={`Order ${order.order_number}`}
        back={{ href: "/admin/orders", label: "Orders" }}
        description={<span className="inline-flex flex-wrap items-center gap-2"><OrderBadge order={order} /> Placed {fmt(order.created_at)}</span>}
      />

      {paid ? (
        <ol className="mb-6 grid grid-cols-4 gap-2" aria-label="Fulfillment progress">
          {STEPS.map((s, i) => (
            <li key={s} className="space-y-2">
              <div className={cn("h-1.5 rounded-full", i <= stepIndex ? "bg-foreground" : "bg-border")} />
              <p className={cn("flex items-center gap-1 text-xs font-medium capitalize sm:text-sm", i <= stepIndex ? "text-foreground" : "text-muted-foreground")}>
                {i <= stepIndex ? <Check aria-hidden className="size-3.5" /> : null}
                {s}
                <span className="sr-only">{i <= stepIndex ? " (done)" : ""}</span>
              </p>
            </li>
          ))}
        </ol>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <Panel title="Items">
            <ul className="divide-y">
              {order.items.map((item) => (
                <li key={item.id} className="flex gap-4 py-3 text-sm first:pt-0">
                  <div className="size-14 shrink-0 overflow-hidden rounded-md border bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnails */}
                    {item.image_url ? <img src={item.image_url} alt="" className="size-full object-cover" /> : null}
                  </div>
                  <div className="flex-1">
                    {item.product_id ? (
                      <Link href={`/admin/products/${item.product_id}`} className="font-medium hover:underline">{item.product_name}</Link>
                    ) : (
                      <p className="font-medium">{item.product_name}</p>
                    )}
                    <p className="text-muted-foreground">{item.variant_name !== "Default" ? `${item.variant_name} · ` : ""}{item.sku}</p>
                    <p className="text-muted-foreground">{item.quantity} × {money(item.unit_price)}</p>
                  </div>
                  <p className="font-medium tabular-nums">{money(item.line_total)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-2 border-t pt-3 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="tabular-nums">{money(order.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">{order.shipping_method_name}</dt><dd className="tabular-nums">{order.shipping_amount === 0 ? "Free" : money(order.shipping_amount)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Tax</dt><dd className="tabular-nums">{money(order.tax_amount)}</dd></div>
              {order.discount_amount > 0 ? <div className="flex justify-between"><dt className="text-muted-foreground">Discount</dt><dd className="tabular-nums">−{money(order.discount_amount)}</dd></div> : null}
              <div className="flex justify-between border-t pt-2 text-base font-semibold"><dt>Total</dt><dd className="tabular-nums">{money(order.total_amount)}</dd></div>
            </dl>
          </Panel>

          <div className="grid gap-6 sm:grid-cols-2">
            <Panel title="Customer">
              <p className="text-sm font-medium">{a.full_name}</p>
              <p className="text-sm"><a href={`mailto:${order.email}`} className="underline underline-offset-4">{order.email}</a></p>
              <p className="text-sm"><a href={`tel:${a.phone}`} className="underline underline-offset-4">{a.phone}</a></p>
              <p className="mt-2 text-xs text-muted-foreground">{order.is_guest ? "Checked out as a guest" : "Has an account"}</p>
              {order.user_id && !order.is_guest ? (
                <Link href={`/admin/customers?q=${encodeURIComponent(order.email)}`} className="mt-1 inline-block text-sm underline underline-offset-4">View customer</Link>
              ) : null}
            </Panel>
            <Panel title="Ship to">
              <address className="text-sm not-italic leading-relaxed">
                {a.full_name}<br />
                {a.address_line_1}<br />
                {a.address_line_2 ? <>{a.address_line_2}<br /></> : null}
                {a.city}{a.state ? `, ${a.state}` : ""} {a.postal_code}<br />
                {a.country}
              </address>
            </Panel>
          </div>

          <Panel title="Payment">
            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[10rem_1fr]">
              <dt className="text-muted-foreground">Payment status</dt><dd className="capitalize">{order.payment_status}</dd>
              <dt className="text-muted-foreground">Paid</dt><dd>{fmt(order.paid_at)}</dd>
              {order.canceled_at ? <><dt className="text-muted-foreground">Canceled</dt><dd>{fmt(order.canceled_at)} · {CANCEL_REASONS[order.cancel_reason ?? ""] ?? order.cancel_reason}</dd></> : null}
              <dt className="text-muted-foreground">Stripe payment</dt>
              <dd className="break-all font-mono text-xs">
                {order.stripe_payment_intent_id ? (
                  <a href={`https://dashboard.stripe.com/payments/${order.stripe_payment_intent_id}`} target="_blank" rel="noreferrer" className="underline underline-offset-4">{order.stripe_payment_intent_id}</a>
                ) : "—"}
              </dd>
              <dt className="text-muted-foreground">Checkout session</dt><dd className="break-all font-mono text-xs">{order.stripe_checkout_session_id ?? "—"}</dd>
            </dl>
          </Panel>
        </div>

        <aside className="space-y-6">
          {paid ? (
            <Panel title="Fulfillment">
              <OrderStatusForm orderId={order.id} status={order.status} />
            </Panel>
          ) : null}
          {order.status !== "canceled" ? (
            <Panel title={paid ? "Refund" : "Cancel"}>
              <CancelOrderForm orderId={order.id} paid={paid} total={money(order.total_amount)} />
            </Panel>
          ) : (
            <Panel title="Canceled">
              <p className="text-sm text-muted-foreground">{CANCEL_REASONS[order.cancel_reason ?? ""] ?? "This order was canceled."} Nothing more to do.</p>
            </Panel>
          )}
        </aside>
      </div>
    </>
  );
}
