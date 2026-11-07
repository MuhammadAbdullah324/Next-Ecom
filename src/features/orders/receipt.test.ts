import { buildReceipt } from "./receipt";
import type { Order } from "./types";

const item = (n: number, over: Partial<Order["items"][number]> = {}): Order["items"][number] => ({
  id: `i${n}`,
  product_name: `Tee ${n}`,
  variant_name: "Default",
  sku: `SKU${n}`,
  image_url: null,
  unit_price: 10,
  quantity: 1,
  line_total: 10,
  product_slug: null,
  ...over,
});

const order = {
  order_number: "NE-1001",
  created_at: "2026-11-01T21:22:00Z",
  currency: "usd",
  items: [item(1, { product_name: "Rainbow Romper", variant_name: "6-12M", quantity: 2, line_total: 49.98 }), item(2)],
  subtotal: 59.98,
  shipping_amount: 0,
  shipping_method_name: "Standard shipping",
  discount_amount: 0,
  tax_amount: 4.8,
  total_amount: 64.78,
};

describe("buildReceipt", () => {
  it("prints the real line items, charges and total", () => {
    const r = buildReceipt(order, { timeZone: "UTC" });
    expect(r.store).toBe("TINY THREADS");
    expect(r.stamp).toBe("01 NOV 2026   21:22");
    expect(r.items).toEqual([
      { label: "2 x Rainbow Romper (6-12M)", amount: "$49.98" },
      { label: "Tee 2", amount: "$10.00" },
    ]);
    expect(r.charges).toEqual([
      { label: "Subtotal", amount: "$59.98" },
      { label: "Standard shipping", amount: "FREE" },
      { label: "Tax", amount: "$4.80" },
    ]);
    expect(r.total).toEqual({ label: "TOTAL", amount: "$64.78" });
  });

  it("shows a discount only when there is one", () => {
    const r = buildReceipt({ ...order, discount_amount: 5 }, { timeZone: "UTC" });
    expect(r.charges.map((c) => c.label)).toContain("Discount");
    expect(r.charges.find((c) => c.label === "Discount")?.amount).toBe("-$5.00");
  });

  it("keeps a long receipt short and counts what it left off", () => {
    const many = Array.from({ length: 11 }, (_, i) => item(i));
    const r = buildReceipt({ ...order, items: many }, { timeZone: "UTC", maxItems: 8 });
    expect(r.items).toHaveLength(8);
    expect(r.hiddenItems).toBe(3);
  });
});
