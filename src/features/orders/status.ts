import type { Order } from "./types";

export type Tone = "neutral" | "success" | "warning" | "danger";

export type OrderOutcome = {
  key: "awaiting_payment" | "paid" | "in_transit" | "delivered" | "payment_failed" | "canceled" | "refunded";
  label: string;
  tone: Tone;
  description: string;
};

// One place that turns (status, payment_status, cancel_reason) into what the shopper reads.
export function describeOrder(order: Pick<Order, "status" | "payment_status" | "cancel_reason">): OrderOutcome {
  if (order.payment_status === "refunded") {
    return { key: "refunded", label: "Refunded", tone: "neutral", description: "This order was refunded to your original payment method." };
  }
  if (order.payment_status === "failed") {
    return {
      key: "payment_failed",
      label: "Payment failed",
      tone: "danger",
      description: "Your payment didn't go through, so the order was not placed. You have not been charged. Your cart is saved.",
    };
  }
  if (order.status === "canceled") {
    const expired = order.cancel_reason === "expired";
    return {
      key: "canceled",
      label: "Canceled",
      tone: "neutral",
      description: expired
        ? "The payment window closed before payment was completed. You have not been charged."
        : "Payment was canceled. You have not been charged.",
    };
  }
  if (order.status === "pending") {
    return {
      key: "awaiting_payment",
      label: "Awaiting payment",
      tone: "warning",
      description: "We're waiting for confirmation of your payment. This page updates automatically.",
    };
  }
  if (order.status === "shipped") {
    return { key: "in_transit", label: "Shipped", tone: "success", description: "Your order is on its way." };
  }
  if (order.status === "delivered") {
    return { key: "delivered", label: "Delivered", tone: "success", description: "Your order was delivered." };
  }
  return {
    key: "paid",
    label: order.status === "processing" ? "Processing" : "Confirmed",
    tone: "success",
    description: "Payment received. We're preparing your order and will email you when it ships.",
  };
}
