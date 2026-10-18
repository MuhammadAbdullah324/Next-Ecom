import type Stripe from "stripe";
import { toMinorUnits } from "@/lib/money";
import type { Order } from "@/features/orders/types";

// Stripe line items built from the order the database priced. Delivery and tax are separate
// lines so the Stripe total equals orders.total_amount exactly (mark_order_paid checks it).
export function stripeLineItems(order: Order): Stripe.Checkout.SessionCreateParams.LineItem[] {
  const currency = order.currency;
  const items: Stripe.Checkout.SessionCreateParams.LineItem[] = order.items.map((item) => ({
    quantity: item.quantity,
    price_data: {
      currency,
      unit_amount: toMinorUnits(item.unit_price),
      product_data: {
        name: item.product_name,
        description: item.variant_name !== "Default" ? item.variant_name : undefined,
        images: item.image_url ? [item.image_url] : undefined,
        metadata: { sku: item.sku },
      },
    },
  }));

  if (order.shipping_amount > 0) {
    items.push({
      quantity: 1,
      price_data: { currency, unit_amount: toMinorUnits(order.shipping_amount), product_data: { name: order.shipping_method_name } },
    });
  }
  if (order.tax_amount > 0) {
    items.push({ quantity: 1, price_data: { currency, unit_amount: toMinorUnits(order.tax_amount), product_data: { name: "Tax" } } });
  }
  return items;
}

export function lineItemsTotal(items: Stripe.Checkout.SessionCreateParams.LineItem[]) {
  return items.reduce((sum, item) => sum + (item.price_data?.unit_amount ?? 0) * (item.quantity ?? 1), 0);
}
