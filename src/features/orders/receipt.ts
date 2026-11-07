import { formatMoney } from "@/lib/money";
import type { Order } from "./types";

export type ReceiptRow = { label: string; amount: string };

export type Receipt = {
  store: string;
  stamp: string; // "01 NOV 2026   21:22"
  orderNumber: string;
  items: ReceiptRow[];
  hiddenItems: number; // items left off a very long receipt
  charges: ReceiptRow[]; // subtotal, shipping, discount, tax
  total: ReceiptRow;
};

export const RECEIPT_MAX_ITEMS = 8;

// What the printed receipt says, built from the real order so prices match what the shopper paid.
export function buildReceipt(
  order: Pick<Order, "order_number" | "created_at" | "currency" | "items" | "subtotal" | "shipping_amount" | "shipping_method_name" | "discount_amount" | "tax_amount" | "total_amount">,
  { timeZone, maxItems = RECEIPT_MAX_ITEMS }: { timeZone?: string; maxItems?: number } = {},
): Receipt {
  const money = (n: number) => formatMoney(n, order.currency);
  const when = new Date(order.created_at);
  const date = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone }).format(when);
  const time = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone }).format(when);

  const items = order.items.slice(0, maxItems).map((item) => {
    const name = item.variant_name && item.variant_name !== "Default" ? `${item.product_name} (${item.variant_name})` : item.product_name;
    return { label: item.quantity > 1 ? `${item.quantity} x ${name}` : name, amount: money(item.line_total) };
  });

  const charges: ReceiptRow[] = [
    { label: "Subtotal", amount: money(order.subtotal) },
    { label: order.shipping_method_name || "Shipping", amount: order.shipping_amount === 0 ? "FREE" : money(order.shipping_amount) },
  ];
  if (order.discount_amount > 0) charges.push({ label: "Discount", amount: `-${money(order.discount_amount)}` });
  charges.push({ label: "Tax", amount: money(order.tax_amount) });

  return {
    store: "TINY THREADS",
    stamp: `${date.replace(/\./g, "").toUpperCase()}   ${time}`,
    orderNumber: order.order_number,
    items,
    hiddenItems: Math.max(0, order.items.length - items.length),
    charges,
    total: { label: "TOTAL", amount: money(order.total_amount) },
  };
}
