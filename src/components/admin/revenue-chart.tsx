import { formatMoney } from "@/lib/money";

const dayFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

// One series (paid revenue per day), so no legend: the panel title names it.
// Each bar has a hover/focus tooltip, and a visually hidden table carries the same numbers.
export function RevenueChart({ daily, currency }: { daily: { day: string; revenue: number; orders: number }[]; currency: string }) {
  const max = Math.max(...daily.map((d) => d.revenue), 0);
  const ticks = max > 0 ? [max, max / 2, 0] : [0];
  const labelEvery = Math.ceil(daily.length / 6);

  return (
    <figure>
      <div className="flex gap-3" aria-hidden="true">
        <div className="flex h-48 flex-col justify-between text-right text-[11px] tabular-nums text-muted-foreground">
          {ticks.map((t) => <span key={t} className="-translate-y-1/2 first:translate-y-0 last:translate-y-0">{formatMoney(t, currency).replace(/\.00$/, "")}</span>)}
        </div>
        <div className="flex-1">
          <div className="relative flex h-48 items-end gap-0.5 border-b border-border">
            <div className="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed border-border" />
            <div className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-border" />
            {daily.map((d) => (
              <div key={d.day} className="group relative flex h-full flex-1 items-end" tabIndex={-1}>
                <div
                  className="w-full rounded-t-[4px] bg-foreground/85 transition-colors group-hover:bg-foreground"
                  style={{ height: max > 0 ? `${Math.max((d.revenue / max) * 100, d.revenue > 0 ? 2 : 0)}%` : 0 }}
                />
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-md group-hover:block">
                  <p className="font-semibold">{dayFormat.format(new Date(d.day))}</p>
                  <p className="tabular-nums">{formatMoney(d.revenue, currency)} · {d.orders} {d.orders === 1 ? "order" : "orders"}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-1.5 flex gap-0.5 text-[11px] text-muted-foreground">
            {daily.map((d, i) => (
              <span key={d.day} className="flex-1 whitespace-nowrap text-center">{i % labelEvery === 0 ? dayFormat.format(new Date(d.day)) : ""}</span>
            ))}
          </div>
        </div>
      </div>
      <table className="sr-only">
        <caption>Paid revenue per day</caption>
        <thead><tr><th>Day</th><th>Revenue</th><th>Orders</th></tr></thead>
        <tbody>
          {daily.map((d) => (
            <tr key={d.day}><td>{dayFormat.format(new Date(d.day))}</td><td>{formatMoney(d.revenue, currency)}</td><td>{d.orders}</td></tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
