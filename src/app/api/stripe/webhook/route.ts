import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { serverEnv } from "@/lib/server-env";
import { recordCheckoutSession, recordUnpaid } from "@/features/payments/fulfillment";
import { getStripe } from "@/features/payments/stripe";

// Stripe calls this with the final outcome of every Checkout Session.
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await request.text(), signature, serverEnv().STRIPE_WEBHOOK_SECRET);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  const handled = [
    "checkout.session.completed",
    "checkout.session.async_payment_succeeded",
    "checkout.session.async_payment_failed",
    "checkout.session.expired",
  ];
  if (!handled.includes(event.type)) return Response.json({ received: true });

  const session = event.data.object as Stripe.Checkout.Session;
  const orderId = session.metadata?.order_id ?? session.client_reference_id ?? null;
  const admin = createAdminClient();

  // Each event is processed once; Stripe retries deliveries, so duplicates are expected.
  const { error: claimError } = await admin.from("payment_events").insert({ id: event.id, type: event.type, order_id: orderId });
  if (claimError) {
    if (claimError.code === "23505") return Response.json({ received: true, duplicate: true });
    console.error("payment_events insert failed", claimError);
    return new Response("Could not record event", { status: 500 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        await recordCheckoutSession(session);
        break;
      case "checkout.session.async_payment_failed":
        await recordUnpaid(session, "failed");
        break;
      case "checkout.session.expired":
        await recordUnpaid(session, "expired");
        break;
    }
  } catch (error) {
    console.error(`Stripe webhook ${event.type} failed`, error);
    // Un-claim so Stripe's retry gets processed.
    await admin.from("payment_events").delete().eq("id", event.id);
    return new Response("Webhook handler failed", { status: 500 });
  }

  return Response.json({ received: true });
}
