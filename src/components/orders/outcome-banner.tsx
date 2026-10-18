import { ButtonLink } from "@/components/ui/button";
import { describeOrder } from "@/features/orders/status";
import type { Order } from "@/features/orders/types";
import { AutoRefresh } from "./auto-refresh";

// The headline for an order page: success, still confirming, failed or canceled, with the next step.
export function OutcomeBanner({ order, isGuest }: { order: Order; isGuest: boolean }) {
  const outcome = describeOrder(order);
  const styles = {
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    danger: "bg-danger-soft text-danger",
    neutral: "bg-line text-ink-soft",
  }[outcome.tone];

  const heading = {
    paid: "Thank you, your order is confirmed",
    in_transit: "Your order is on its way",
    delivered: "Your order was delivered",
    awaiting_payment: "Confirming your payment",
    payment_failed: "Your payment didn't go through",
    canceled: "This order was canceled",
    refunded: "This order was refunded",
  }[outcome.key];

  return (
    <div className={`rounded-card px-6 py-6 ${styles}`} role="status">
      {outcome.key === "awaiting_payment" ? <AutoRefresh /> : null}
      <h1 className="text-2xl font-bold tracking-tight">{heading}</h1>
      <p className="mt-2 text-ink-soft">{outcome.description}</p>
      {outcome.key === "paid" ? (
        <p className="mt-2 text-ink-soft">
          A confirmation email is on its way to <strong>{order.email}</strong>.
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-3">
        {outcome.key === "payment_failed" || outcome.key === "canceled" ? (
          <ButtonLink href="/cart">Return to cart</ButtonLink>
        ) : (
          <ButtonLink href="/products" variant="secondary">Continue shopping</ButtonLink>
        )}
        {outcome.key === "paid" && isGuest ? (
          <ButtonLink href="/sign-up?next=/orders">Create an account to track this order</ButtonLink>
        ) : null}
      </div>
    </div>
  );
}
