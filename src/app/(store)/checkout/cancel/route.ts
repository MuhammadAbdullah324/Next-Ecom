import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/features/payments/stripe";

// Stripe sends the shopper here when they leave the payment page without paying.
export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get("order");
  const cartUrl = new URL("/cart?payment=canceled", request.nextUrl.origin);
  if (!orderId) return NextResponse.redirect(cartUrl);

  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id, status, stripe_checkout_session_id")
    .eq("id", orderId)
    .maybeSingle();

  if (order?.status === "pending") {
    // Close the Stripe page first so it can't be paid after we release the stock.
    if (order.stripe_checkout_session_id) {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(order.stripe_checkout_session_id);
      if (session.status === "complete") {
        return NextResponse.redirect(new URL(`/checkout/confirmation?session_id=${session.id}`, request.nextUrl.origin));
      }
      if (session.status === "open") await stripe.checkout.sessions.expire(session.id);
    }
    await supabase.rpc("cancel_my_pending_order", { target_order: order.id });
  }

  return NextResponse.redirect(cartUrl);
}
