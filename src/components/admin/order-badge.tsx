import { describeOrder } from "@/features/orders/status";
import type { OrderStatus, PaymentStatus } from "@/features/orders/types";
import { Badge } from "@/components/ui/badge";

export function OrderBadge({ order }: { order: { status: OrderStatus; payment_status: PaymentStatus; cancel_reason: string | null } }) {
  const outcome = describeOrder(order);
  const label = order.status === "canceled" && order.cancel_reason === "expired" ? "Expired" : outcome.label;
  const tone = order.status === "confirmed" ? "warning" : order.status === "processing" ? "brand" : outcome.tone;
  return <Badge variant={tone}>{order.status === "confirmed" ? "Paid · to fulfill" : label}</Badge>;
}
