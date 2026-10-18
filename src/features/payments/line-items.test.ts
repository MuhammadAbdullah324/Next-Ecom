import type { Order } from "@/features/orders/types";
import { lineItemsTotal, stripeLineItems } from "./line-items";

const order = {
  currency: "usd",
  shipping_method_name: "Standard delivery",
  subtotal: 74.97,
  shipping_amount: 5,
  tax_amount: 6,
  total_amount: 85.97,
  items: [
    { id: "1", product_name: "Striped Cotton Tee", variant_name: "Navy / 2-3Y", sku: "SD-TEE", image_url: null, unit_price: 24.99, quantity: 3, line_total: 74.97, product_slug: null },
  ],
} as unknown as Order;

describe("stripeLineItems", () => {
  it("adds delivery and tax lines so Stripe charges exactly the order total", () => {
    const items = stripeLineItems(order);
    expect(items.map((i) => i.price_data?.product_data?.name)).toEqual(["Striped Cotton Tee", "Standard delivery", "Tax"]);
    expect(lineItemsTotal(items)).toBe(8597);
  });

  it("omits zero delivery and tax and hides the Default variant name", () => {
    const items = stripeLineItems({ ...order, shipping_amount: 0, tax_amount: 0, items: [{ ...order.items[0], variant_name: "Default" }] });
    expect(items).toHaveLength(1);
    expect(items[0].price_data?.product_data?.description).toBeUndefined();
  });
});
