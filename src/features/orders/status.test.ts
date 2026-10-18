import { describeOrder } from "./status";

describe("describeOrder", () => {
  it.each([
    [{ status: "pending", payment_status: "pending", cancel_reason: null }, "awaiting_payment", "warning"],
    [{ status: "confirmed", payment_status: "paid", cancel_reason: null }, "paid", "success"],
    [{ status: "shipped", payment_status: "paid", cancel_reason: null }, "in_transit", "success"],
    [{ status: "canceled", payment_status: "failed", cancel_reason: "payment_failed" }, "payment_failed", "danger"],
    [{ status: "canceled", payment_status: "canceled", cancel_reason: "customer_canceled" }, "canceled", "neutral"],
    [{ status: "canceled", payment_status: "refunded", cancel_reason: "admin" }, "refunded", "neutral"],
  ] as const)("%o -> %s", (order, key, tone) => {
    const outcome = describeOrder(order);
    expect(outcome.key).toBe(key);
    expect(outcome.tone).toBe(tone);
  });

  it("tells shoppers they were not charged when payment did not happen", () => {
    expect(describeOrder({ status: "canceled", payment_status: "canceled", cancel_reason: "expired" }).description).toMatch(/not been charged/);
  });
});
