import "server-only";
import type Stripe from "stripe";
import { revalidateTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { publicEnv } from "@/lib/env";
import { CATALOG_TAG } from "@/features/catalog/queries";
import { orderConfirmationEmail } from "@/features/email/order-confirmation";
import { sendEmail } from "@/features/email/send";
import type { Order } from "@/features/orders/types";
import { toAmount } from "@/lib/money";
import { getStripe } from "./stripe";

export type PaidResult = "paid" | "already_paid" | "pending" | "refunded";

// Stock changed, so cached catalog pages should refresh. revalidateTag only works in Route Handlers
// and Server Functions; when this runs while rendering the confirmation page, the catalog's
// short cache lifetime covers it instead.
function refreshCatalog() {
  try {
    revalidateTag(CATALOG_TAG, "max");
  } catch {
    // called during render
  }
}

function orderIdOf(session: Stripe.Checkout.Session) {
  return session.metadata?.order_id ?? session.client_reference_id ?? null;
}

async function loadOrderForEmail(orderId: string): Promise<Order | null> {
  const { data } = await createAdminClient()
    .from("orders")
    .select(
      `id, order_number, status, payment_status, cancel_reason, is_guest, email, shipping_method_code, shipping_method_name,
       shipping_address, currency, subtotal, shipping_amount, tax_amount, discount_amount, total_amount,
       stripe_checkout_session_id, created_at, paid_at,
       items:order_items ( id, product_name, variant_name, sku, image_url, unit_price, quantity, line_total )`,
    )
    .eq("id", orderId)
    .maybeSingle();
  if (!data) return null;
  return {
    ...data,
    subtotal: toAmount(data.subtotal),
    shipping_amount: toAmount(data.shipping_amount),
    tax_amount: toAmount(data.tax_amount),
    discount_amount: toAmount(data.discount_amount),
    total_amount: toAmount(data.total_amount),
    items: data.items.map((i) => ({ ...i, unit_price: toAmount(i.unit_price), line_total: toAmount(i.line_total), product_slug: null })),
  } as Order;
}

// Records a completed Checkout Session. Called by the webhook and by the confirmation page,
// so whichever arrives first confirms the order; the database makes the second call a no-op.
export async function recordCheckoutSession(session: Stripe.Checkout.Session): Promise<PaidResult> {
  const orderId = orderIdOf(session);
  if (!orderId) throw new Error(`Checkout session ${session.id} has no order id`);
  if (session.payment_status !== "paid") return "pending";

  const paymentIntent = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;
  const { data, error } = await createAdminClient().rpc("mark_order_paid", {
    target_order: orderId,
    session_id: session.id,
    payment_intent: paymentIntent,
    amount_minor: session.amount_total ?? 0,
    paid_currency: session.currency ?? "",
  });

  if (error) {
    // The order can't take this payment (already canceled, or the amount differs). Give the money back.
    if (["not_payable", "amount_mismatch", "session_mismatch"].includes(error.hint ?? "") && paymentIntent) {
      console.error(`Refunding ${paymentIntent} for order ${orderId}: ${error.message}`);
      await getStripe().refunds.create({ payment_intent: paymentIntent }, { idempotencyKey: `refund-${session.id}` });
      // Close the order (no-op if it was already canceled) so its reserved stock is released.
      await createAdminClient().rpc("mark_order_unpaid", { target_order: orderId, outcome: "failed" });
      return "refunded";
    }
    throw new Error(`mark_order_paid failed: ${error.message}`);
  }

  if (data === "paid") {
    refreshCatalog();
    const order = await loadOrderForEmail(orderId);
    if (order) {
      const url = `${publicEnv.NEXT_PUBLIC_SITE_URL}/orders/${order.order_number}`;
      await sendEmail(order.email, orderConfirmationEmail(order, url));
    }
  }
  return data as PaidResult;
}

// Payment did not happen: the session expired or an async payment failed. Releases reserved stock.
export async function recordUnpaid(session: Stripe.Checkout.Session, outcome: "failed" | "expired") {
  const orderId = orderIdOf(session);
  if (!orderId) return;
  const { error } = await createAdminClient().rpc("mark_order_unpaid", { target_order: orderId, outcome });
  if (error) throw new Error(`mark_order_unpaid failed: ${error.message}`);
  refreshCatalog();
}
