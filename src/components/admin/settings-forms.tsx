"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { saveSettings, saveShippingMethod } from "@/features/admin/store-actions";
import type { FormState } from "@/features/admin/validation";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { CheckboxField, FormStatus } from "./form-fields";

export function StoreSettingsForm({ storeName, taxRate, currency }: { storeName: string; taxRate: number; currency: string }) {
  const [state, action] = useActionState<FormState, FormData>(saveSettings, {});
  const err = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-5" noValidate>
      <FormStatus state={state} />
      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Store name" name="store_name" required defaultValue={storeName} error={err.store_name} />
        <Field label="Sales tax (%)" name="tax_percent" type="number" min="0" max="99.99" step="0.01" required defaultValue={Math.round(taxRate * 10000) / 100} error={err.tax_percent} hint="Added to every order at checkout." />
        <Field label="Currency" name="currency_display" disabled defaultValue={currency.toUpperCase()} hint="Set in the database; Stripe charges in this currency." required />
      </div>
      <SubmitButton pendingLabel="Saving…">Save settings</SubmitButton>
    </form>
  );
}

type Method = { code: string; name: string; description: string | null; price: number; free_over: number | null; min_days: number; max_days: number; sort_order: number; is_active: boolean };

function ShippingForm({ method, onDone }: { method?: Method; onDone?: () => void }) {
  const [state, action] = useActionState<FormState, FormData>(async (prev: FormState, fd: FormData) => {
    const result = await saveShippingMethod(prev, fd);
    if (result.ok && !method) onDone?.();
    return result;
  }, {});
  const err = state.fieldErrors ?? {};
  const key = method?.code ?? "new";
  return (
    <form action={action} className="space-y-4" noValidate>
      {method ? <input type="hidden" name="existing_code" value={method.code} /> : null}
      <FormStatus state={state} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Name" name="name" id={`s-name-${key}`} required defaultValue={method?.name} error={err.name} />
        <Field label="Code" name="code" id={`s-code-${key}`} required defaultValue={method?.code} readOnly={!!method} error={err.code} hint={method ? "Can't be changed." : "e.g. next_day"} />
        <Field label="Price" name="price" id={`s-price-${key}`} type="number" min="0" step="0.01" required defaultValue={method?.price ?? 0} error={err.price} />
        <Field label="Free over" name="free_over" id={`s-free-${key}`} type="number" min="0" step="0.01" defaultValue={method?.free_over ?? ""} error={err.free_over} hint="Order subtotal for free delivery." />
        <Field label="Description" name="description" id={`s-desc-${key}`} defaultValue={method?.description ?? ""} error={err.description} className="sm:col-span-2" />
        <Field label="Min days" name="min_days" id={`s-min-${key}`} type="number" min="0" step="1" required defaultValue={method?.min_days ?? 2} error={err.min_days} />
        <Field label="Max days" name="max_days" id={`s-max-${key}`} type="number" min="0" step="1" required defaultValue={method?.max_days ?? 5} error={err.max_days} />
        <Field label="Order" name="sort_order" id={`s-sort-${key}`} type="number" min="0" step="1" defaultValue={method?.sort_order ?? 0} />
        <CheckboxField name="is_active" label="Offered at checkout" defaultChecked={method?.is_active ?? true} className="sm:col-span-2 lg:col-span-3" />
      </div>
      <SubmitButton size="sm" pendingLabel="Saving…">{method ? "Save" : "Add delivery method"}</SubmitButton>
    </form>
  );
}

export function ShippingMethods({ methods }: { methods: Method[] }) {
  const [adding, setAdding] = useState(false);
  return (
    <div className="space-y-4">
      {methods.map((m) => (
        <details key={m.code} className="group rounded-lg border">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 text-sm">
            <span>
              <span className="font-semibold">{m.name}</span>
              <span className="text-muted-foreground"> · ${m.price.toFixed(2)}{m.free_over ? `, free over $${m.free_over.toFixed(2)}` : ""} · {m.min_days}–{m.max_days} days</span>
            </span>
            <span className="text-xs font-medium text-muted-foreground">{m.is_active ? "On" : "Off"} · <span className="underline">Edit</span></span>
          </summary>
          <div className="border-t p-4">
            <ShippingForm method={m} />
          </div>
        </details>
      ))}
      {adding ? (
        <div className="rounded-lg border bg-muted/40 p-4">
          <ShippingForm onDone={() => setAdding(false)} />
        </div>
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={() => setAdding(true)}><Plus aria-hidden /> Add delivery method</Button>
      )}
    </div>
  );
}
