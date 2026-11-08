import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { requireAdmin } from "@/features/admin/guard";
import { getDashboardStats, listAdminOrders, listLowStock, textParam } from "@/features/admin/queries";
import { getStoreSettings } from "@/features/checkout/queries";
import { formatMoney } from "@/lib/money";
import { AdminPageHeader, Panel, AdminSkeleton } from "@/components/admin/page-header";
import { OrderBadge } from "@/components/admin/order-badge";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Overview" };

const RANGES = [7, 30, 90] as const;

function Stat({ label, value, sub, href }: { label: string; value: string; sub?: string; href?: string }) {
  const body = (
    <>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums">{value}</p>
      {sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
    </>
  );
  return href ? (
    <Link href={href} className="block rounded-xl border bg-card p-5 transition-colors hover:border-foreground">{body}</Link>
  ) : (
    <div className="rounded-xl border bg-card p-5">{body}</div>
  );
}

async function AdminOverviewPageContent({ searchParams }: PageProps<"/admin">) {
  const user = await requireAdmin("/admin");
  const sp = await searchParams;
  const days = RANGES.find((r) => String(r) === textParam(sp.days)) ?? 30;
  const [stats, settings, recent, lowStock] = await Promise.all([
    getDashboardStats(days),
    getStoreSettings(),
    listAdminOrders({ page: 1 }),
    listLowStock(8, 5),
  ]);
  const money = (n: number) => formatMoney(n, settings.currency);
  const average = stats.paid_orders ? stats.revenue / stats.paid_orders : 0;

  return (
    <>
      <AdminPageHeader
        title="Overview"
        description={`Signed in as ${user.email}`}
        actions={
          <nav aria-label="Date range" className="flex rounded-md border bg-card p-0.5">
            {RANGES.map((r) => (
              <Link key={r} href={r === 30 ? "/admin" : `/admin?days=${r}`} aria-current={r === days ? "page" : undefined} className={cn("rounded px-3 py-1.5 text-sm font-medium", r === days ? "bg-foreground text-background" : "hover:bg-muted")}>
                {r} days
              </Link>
            ))}
          </nav>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label={`Revenue, last ${days} days`} value={money(stats.revenue)} sub={`${stats.paid_orders} paid ${stats.paid_orders === 1 ? "order" : "orders"} · avg ${money(average)}`} />
        <Stat label="To fulfill" value={String(stats.to_fulfill)} sub="Paid, not shipped yet" href="/admin/orders?status=to_fulfill" />
        <Stat label="Customers" value={String(stats.customers)} sub={`${stats.new_customers} new in ${days} days`} href="/admin/customers" />
        <Stat label="Low stock" value={String(stats.low_stock)} sub={`Variants with 5 or fewer · ${stats.active_products} live products`} href="/admin/products" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_22rem]">
        <Panel title="Paid revenue per day" description="By the day payment arrived (UTC). Refunded orders are left out.">
          <RevenueChart daily={stats.daily} currency={settings.currency} />
        </Panel>
        <Panel title="Running low" actions={<Link href="/admin/products" className="text-sm underline underline-offset-4">Products</Link>}>
          {lowStock.length === 0 ? (
            <p className="text-sm text-muted-foreground">Everything has more than 5 in stock.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {lowStock.map((v) => (
                <li key={v.id} className="flex items-center justify-between gap-3">
                  <Link href={`/admin/products/${v.product.id}`} className="min-w-0 hover:underline">
                    <span className="block truncate font-medium">{v.product.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{v.name} · {v.sku}</span>
                  </Link>
                  <span className={cn("inline-flex shrink-0 items-center gap-1 font-semibold tabular-nums", v.stock_quantity === 0 ? "text-danger" : "text-warning")}>
                    {v.stock_quantity === 0 ? <AlertTriangle aria-hidden className="size-3.5" /> : null}
                    {v.stock_quantity === 0 ? "Sold out" : `${v.stock_quantity} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel
        className="mt-6"
        title="Latest orders"
        description={stats.awaiting_payment ? `${stats.awaiting_payment} waiting for payment` : undefined}
        actions={<Link href="/admin/orders" className="inline-flex items-center gap-1 text-sm underline underline-offset-4">All orders <ArrowRight aria-hidden className="size-3.5" /></Link>}
      >
        {recent.orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No orders yet.</p>
        ) : (
          <ul className="-my-2 divide-y">
            {recent.orders.slice(0, 8).map((o) => (
              <li key={o.id}>
                <Link href={`/admin/orders/${o.id}`} className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-sm hover:opacity-80">
                  <span>
                    <span className="font-medium">{o.order_number}</span>
                    <span className="block text-xs text-muted-foreground">{o.customer_name ?? o.email}</span>
                  </span>
                  <span className="flex items-center gap-3">
                    <OrderBadge order={o} />
                    <span className="w-20 text-right font-medium tabular-nums">{formatMoney(o.total_amount, o.currency)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}

// The Suspense boundary sits inside the page so switching between admin pages shows the
// skeleton at once while live data streams in (an instant navigation).
export default function AdminOverviewPage(props: PageProps<"/admin">) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <AdminOverviewPageContent {...props} />
    </Suspense>
  );
}
