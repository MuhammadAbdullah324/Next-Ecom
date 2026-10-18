import { formatMoney } from "@/lib/money";

// Current price with the "was" price and a discount badge when there is a real saving.
export function Price({
  amount,
  compareAt,
  currency = "usd",
  from = false,
  size = "md",
}: {
  amount: number;
  compareAt?: number | null;
  currency?: string;
  from?: boolean;
  size?: "md" | "lg";
}) {
  const onSale = compareAt != null && compareAt > amount;
  const percent = onSale ? Math.round(((compareAt - amount) / compareAt) * 100) : 0;
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span className={size === "lg" ? "text-2xl font-semibold" : "font-semibold"}>
        {from ? <span className="text-sm font-normal text-muted">From </span> : null}
        {formatMoney(amount, currency)}
      </span>
      {onSale ? (
        <>
          <span className="text-sm text-muted line-through">
            <span className="sr-only">Was </span>
            {formatMoney(compareAt, currency)}
          </span>
          <span className="rounded-full bg-danger-soft px-2 py-0.5 text-xs font-semibold text-danger">−{percent}%</span>
        </>
      ) : null}
    </div>
  );
}
