import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { requireAdmin } from "@/features/admin/guard";
import { listAdminOrders, ORDER_FILTERS, pageParam, textParam } from "@/features/admin/queries";
import { formatMoney } from "@/lib/money";
import { AdminPageHeader, EmptyState } from "@/components/admin/page-header";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { OrderBadge } from "@/components/admin/order-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Orders" };

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  await requireAdmin("/admin/orders");
  const sp = await searchParams;
  const filters = { status: textParam(sp.status), q: textParam(sp.q), page: pageParam(sp.page) };
  const { orders, total, pageCount } = await listAdminOrders(filters);

  const tabHref = (status: string) => {
    const p = new URLSearchParams();
    if (status) p.set("status", status);
    if (filters.q) p.set("q", filters.q);
    const qs = p.toString();
    return qs ? `/admin/orders?${qs}` : "/admin/orders";
  };

  return (
    <>
      <AdminPageHeader title="Orders" description="Times are in UTC." />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Filter orders" className="-mx-1 flex gap-1 overflow-x-auto px-1 [scrollbar-width:none]">
          {ORDER_FILTERS.map((f) => {
            const active = (filters.status ?? "") === f.value;
            return (
              <Link
                key={f.value}
                href={tabHref(f.value)}
                aria-current={active ? "page" : undefined}
                className={cn("whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium", active ? "border-foreground bg-foreground text-background" : "bg-card hover:border-foreground")}
              >
                {f.label}
              </Link>
            );
          })}
        </nav>
        <form role="search" className="flex gap-2">
          {filters.status ? <input type="hidden" name="status" value={filters.status} /> : null}
          <div className="relative">
            <label htmlFor="order-q" className="sr-only">Search orders</label>
            <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="order-q" name="q" type="search" defaultValue={filters.q} placeholder="Order number or email" className="min-h-10 w-64 pl-9 text-sm" />
          </div>
          <Button type="submit" variant="outline" size="sm" className="min-h-10">Search</Button>
        </form>
      </div>

      {orders.length === 0 ? (
        <EmptyState title="No orders here">{filters.q || filters.status ? "Try another filter or search." : "Orders appear here as soon as shoppers check out."}</EmptyState>
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead className="hidden md:table-cell">Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id} className="relative">
                  <TableCell>
                    <Link href={`/admin/orders/${o.id}`} className="font-medium after:absolute after:inset-0 hover:underline">{o.order_number}</Link>
                    <p className="text-xs text-muted-foreground">{dateFormat.format(new Date(o.created_at))} · {o.item_count} {o.item_count === 1 ? "item" : "items"}</p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <p>{o.customer_name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{o.email}{o.is_guest ? " · guest" : ""}</p>
                  </TableCell>
                  <TableCell><OrderBadge order={o} /></TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{formatMoney(o.total_amount, o.currency)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <AdminPagination base="/admin/orders" params={{ status: filters.status, q: filters.q }} page={filters.page} pageCount={pageCount} total={total} />
    </>
  );
}
