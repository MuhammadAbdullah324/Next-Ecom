import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { describeOrder } from "@/features/orders/status";
import type { Order } from "@/features/orders/types";
import { formatMoney } from "@/lib/money";

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" });

export function OrderDetails({ order }: { order: Order }) {
  const money = (n: number) => formatMoney(n, order.currency);
  const a = order.shipping_address;
  const outcome = describeOrder(order);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <section aria-labelledby="items-heading" className="rounded-card border border-line bg-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="items-heading" className="text-lg font-semibold">Order {order.order_number}</h2>
          <Badge tone={outcome.tone}>{outcome.label}</Badge>
        </div>
        <p className="mt-1 text-sm text-muted">Placed {dateFormat.format(new Date(order.created_at))}</p>
        <ul className="mt-6 divide-y divide-line">
          {order.items.map((item) => (
            <li key={item.id} className="flex gap-4 py-4 text-sm">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-line">
                {item.image_url ? <Image src={item.image_url} alt="" fill sizes="64px" className="object-cover" /> : null}
              </div>
              <div className="flex-1">
                {item.product_slug ? (
                  <Link href={`/products/${item.product_slug}`} className="font-medium hover:underline">{item.product_name}</Link>
                ) : (
                  <p className="font-medium">{item.product_name}</p>
                )}
                {item.variant_name !== "Default" ? <p className="text-muted">{item.variant_name}</p> : null}
                <p className="text-muted">
                  {item.quantity} × {money(item.unit_price)}
                </p>
              </div>
              <p className="font-medium tabular-nums">{money(item.line_total)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-2 space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd className="tabular-nums">{money(order.subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-ink-soft">{order.shipping_method_name}</dt><dd className="tabular-nums">{order.shipping_amount === 0 ? "Free" : money(order.shipping_amount)}</dd></div>
          <div className="flex justify-between"><dt className="text-ink-soft">Tax</dt><dd className="tabular-nums">{money(order.tax_amount)}</dd></div>
          <div className="flex justify-between border-t border-line pt-3 text-base font-semibold"><dt>Total</dt><dd className="tabular-nums">{money(order.total_amount)}</dd></div>
        </dl>
      </section>

      <aside className="space-y-6">
        <section className="rounded-card border border-line bg-surface p-6 text-sm">
          <h2 className="font-semibold">Delivery address</h2>
          <address className="mt-2 not-italic leading-relaxed text-ink-soft">
            {a.full_name}<br />
            {a.address_line_1}<br />
            {a.address_line_2 ? <>{a.address_line_2}<br /></> : null}
            {a.city}{a.state ? `, ${a.state}` : ""} {a.postal_code}<br />
            {a.country}<br />
            {a.phone}
          </address>
        </section>
        <section className="rounded-card border border-line bg-surface p-6 text-sm">
          <h2 className="font-semibold">Contact</h2>
          <p className="mt-2 text-ink-soft">{order.email}</p>
        </section>
      </aside>
    </div>
  );
}
