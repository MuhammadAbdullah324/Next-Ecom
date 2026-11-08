"use client";

import { useActionState } from "react";
import { cancelOrder, setOrderStatus } from "@/features/admin/store-actions";
import type { FormState } from "@/features/admin/validation";
import type { OrderStatus } from "@/features/orders/types";
import { NativeSelect } from "@/components/ui/native-select";
import { SubmitButton } from "@/components/ui/submit-button";
import { CheckboxField, FormStatus } from "./form-fields";
import { ConfirmButton } from "./confirm-button";

const STEPS: { value: OrderStatus; label: string }[] = [
  { value: "confirmed", label: "Confirmed (paid)" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
];

export function OrderStatusForm({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const [state, action] = useActionState<FormState, FormData>(setOrderStatus, {});
  const next = STEPS[STEPS.findIndex((s) => s.value === status) + 1];
  return (
    <div className="space-y-3">
      <FormStatus state={state} />
      {next ? (
        <form action={action}>
          <input type="hidden" name="id" value={orderId} />
          <input type="hidden" name="status" value={next.value} />
          <SubmitButton className="w-full" pendingLabel="Saving…">Mark as {next.label.toLowerCase().replace(" (paid)", "")}</SubmitButton>
        </form>
      ) : null}
      <form action={action} className="flex items-end gap-2">
        <input type="hidden" name="id" value={orderId} />
        <div className="flex-1 space-y-1.5">
          <label htmlFor="order-status" className="text-xs font-semibold text-muted-foreground">Or set the status</label>
          <NativeSelect id="order-status" name="status" defaultValue={status} className="w-full">
            {STEPS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </NativeSelect>
        </div>
        <SubmitButton variant="outline" size="sm" className="min-h-10" pendingLabel="…">Update</SubmitButton>
      </form>
    </div>
  );
}

export function CancelOrderForm({ orderId, paid, total }: { orderId: string; paid: boolean; total: string }) {
  const [state, action] = useActionState<FormState, FormData>(cancelOrder, {});
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={orderId} />
      <FormStatus state={state} />
      <p className="text-sm text-muted-foreground">
        {paid
          ? `Refunds the full ${total} to the customer's card in Stripe and cancels the order.`
          : "Closes the customer's payment page and releases the reserved stock."}
      </p>
      {paid ? <CheckboxField name="restock" label="Put the items back in stock" defaultChecked hint="Untick if the parcel already left and won't come back." /> : <input type="hidden" name="restock" value="on" />}
      <ConfirmButton variant="destructive" className="w-full" pendingLabel={paid ? "Refunding…" : "Canceling…"} message={paid ? `Refund ${total} and cancel this order? This can't be undone.` : "Cancel this order?"}>
        {paid ? "Refund and cancel" : "Cancel order"}
      </ConfirmButton>
    </form>
  );
}
