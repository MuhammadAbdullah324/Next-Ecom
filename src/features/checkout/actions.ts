"use server";

import { redirect } from "next/navigation";
import { requestSiteUrl } from "@/lib/site-url";
import { userMessage } from "@/lib/db-errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getOrderById, getPendingOrders } from "@/features/orders/queries";
import { recordCheckoutSession } from "@/features/payments/fulfillment";
import { lineItemsTotal, stripeLineItems } from "@/features/payments/line-items";
import { getStripe } from "@/features/payments/stripe";
import { fieldErrors, parseCheckoutForm } from "./validation";

export type CheckoutState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

const STRIPE_SESSION_MINUTES = 30;

// Closes earlier checkout attempts for this cart. If one was actually paid in the meantime,
// returns its session id so the shopper goes to that confirmation instead of paying twice.
async function settleEarlierAttempts(): Promise<string | null> {
  const stripe = getStripe();
  for (const order of await getPendingOrders()) {
    if (!order.stripe_checkout_session_id) continue;
    const session = await stripe.checkout.sessions.retrieve(order.stripe_checkout_session_id);
    if (session.status === "open") {
      await stripe.checkout.sessions.expire(session.id);
    } else if (session.status === "complete" && session.payment_status === "paid") {
      await recordCheckoutSession(session);
      return session.id;
    }
  }
  return null;
}

export async function startCheckout(_: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your cart is empty." };

  // Guests have no account email, so they must give one.
  const parsed = parseCheckoutForm(formData);
  const errors = parsed.success ? {} : fieldErrors(parsed.error);
  if (user.is_anonymous && !parsed.data?.email) errors.email ??= "Enter a valid email address.";
  if (!parsed.success || Object.keys(errors).length > 0) return { error: "Check the highlighted fields.", fieldErrors: errors };
  const input = parsed.data;

  let redirectTo: string;
  try {
    const alreadyPaid = await settleEarlierAttempts();
    if (alreadyPaid) redirect(`/checkout/confirmation?session_id=${alreadyPaid}`);

    // The database checks stock, prices the order and reserves the items.
    const { data: orderId, error } = await supabase.rpc("create_checkout_order", {
      shipping_method: input.shippingMethod,
      saved_address: input.addressMode === "saved" ? input.savedAddressId : null,
      new_address: input.addressMode === "new" ? input.address : null,
      contact_email: input.email ?? null,
      save_address: input.addressMode === "new" ? input.saveAddress : false,
    });
    if (error || !orderId) {
      const message = userMessage(error, "We couldn't start checkout. Please try again.");
      if (error?.hint === "email") return { error: message, fieldErrors: { email: message } };
      return { error: message };
    }

    const order = await getOrderById(orderId);
    if (!order) return { error: "We couldn't start checkout. Please try again." };

    const lineItems = stripeLineItems(order);
    if (lineItemsTotal(lineItems) !== Math.round(order.total_amount * 100)) {
      throw new Error(`Line items do not add up to order ${order.order_number}`);
    }

    try {
      const site = await requestSiteUrl();
      const session = await getStripe().checkout.sessions.create(
        {
          mode: "payment",
          line_items: lineItems,
          customer_email: order.email,
          client_reference_id: order.id,
          metadata: { order_id: order.id, order_number: order.order_number },
          payment_intent_data: { metadata: { order_id: order.id, order_number: order.order_number } },
          expires_at: Math.floor(Date.now() / 1000) + (STRIPE_SESSION_MINUTES + 1) * 60,
          success_url: `${site}/checkout/confirmation?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${site}/checkout/cancel?order=${order.id}`,
        },
        { idempotencyKey: `checkout-${order.id}` },
      );
      const { error: attachError } = await createAdminClient().rpc("attach_checkout_session", {
        target_order: order.id,
        session_id: session.id,
      });
      if (attachError) throw new Error(`attach_checkout_session failed: ${attachError.message}`);
      if (!session.url) throw new Error("Stripe returned no checkout URL");
      redirectTo = session.url;
    } catch (stripeError) {
      // Release the reserved stock; the cart is unchanged so the shopper can try again.
      await supabase.rpc("cancel_my_pending_order", { target_order: order.id });
      throw stripeError;
    }
  } catch (e) {
    if (e instanceof Error && "digest" in e && String(e.digest).startsWith("NEXT_REDIRECT")) throw e;
    console.error("startCheckout failed", e);
    return { error: "We couldn't connect to the payment provider. You have not been charged. Please try again." };
  }

  redirect(redirectTo);
}
