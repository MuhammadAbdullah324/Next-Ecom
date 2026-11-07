import type { Metadata } from "next";
import { Search } from "lucide-react";
import { requireAdmin } from "@/features/admin/guard";
import { listAdminCustomers, pageParam, textParam } from "@/features/admin/queries";
import { setCustomerRole } from "@/features/admin/store-actions";
import { getStoreSettings } from "@/features/checkout/queries";
import { formatMoney } from "@/lib/money";
import { AdminPageHeader, EmptyState } from "@/components/admin/page-header";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const metadata: Metadata = { title: "Customers" };

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" });

export default async function AdminCustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  const me = await requireAdmin("/admin/customers");
  const sp = await searchParams;
  const filters = { q: textParam(sp.q), page: pageParam(sp.page) };
  const [{ customers, total, pageCount }, settings] = await Promise.all([listAdminCustomers(filters), getStoreSettings()]);
  const error = textParam(sp.error);

  return (
    <>
      <AdminPageHeader title="Customers" description="Accounts that signed up. Guest shoppers appear on their orders only." />
      {error ? <Alert variant="destructive" className="mb-4">{error}</Alert> : null}
      <form role="search" className="mb-4 flex max-w-md gap-2">
        <div className="relative flex-1">
          <label htmlFor="customer-q" className="sr-only">Search customers</label>
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="customer-q" name="q" type="search" defaultValue={filters.q} placeholder="Name or email" className="min-h-10 pl-9 text-sm" />
        </div>
        <Button type="submit" variant="outline" size="sm" className="min-h-10">Search</Button>
      </form>

      {customers.length === 0 ? (
        <EmptyState title={filters.q ? "No customers match" : "No customers yet"} />
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead className="hidden sm:table-cell">Joined</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Spent</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((c) => {
                const self = c.id === me.id;
                const makeAdmin = c.role !== "admin";
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <p className="font-medium">{c.full_name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{c.email}{c.phone ? ` · ${c.phone}` : ""}</p>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">{dateFormat.format(new Date(c.created_at))}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {c.orders > 0 && c.email ? <a href={`/admin/orders?q=${encodeURIComponent(c.email)}`} className="underline underline-offset-4">{c.orders}</a> : c.orders}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatMoney(c.spent, settings.currency)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {c.role === "admin" ? <Badge>Admin</Badge> : <Badge variant="neutral">Customer</Badge>}
                        {self ? null : (
                          <form action={setCustomerRole}>
                            <input type="hidden" name="id" value={c.id} />
                            <input type="hidden" name="role" value={makeAdmin ? "admin" : "customer"} />
                            <ConfirmButton
                              size="sm"
                              variant="ghost"
                              pendingLabel="…"
                              message={makeAdmin ? `Give ${c.email} full admin access to the store?` : `Remove admin access from ${c.email}?`}
                            >
                              {makeAdmin ? "Make admin" : "Remove admin"}
                            </ConfirmButton>
                          </form>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
      <AdminPagination base="/admin/customers" params={{ q: filters.q }} page={filters.page} pageCount={pageCount} total={total} />
    </>
  );
}
