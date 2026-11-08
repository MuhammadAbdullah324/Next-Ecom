"use client";

import { useActionState, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { deleteVariant, saveVariant, setVariantStock } from "@/features/admin/catalog-actions";
import { formatKeyValues, type FormState } from "@/features/admin/validation";
import { formatMoney } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { CheckboxField, FormStatus, TextareaField } from "./form-fields";
import { ConfirmButton } from "./confirm-button";

export type VariantValues = {
  id: string;
  sku: string;
  name: string;
  options: Record<string, string>;
  price: number | null;
  stock_quantity: number;
  is_default: boolean;
  is_active: boolean;
  sort_order: number;
};

function StockCell({ variant }: { variant: VariantValues }) {
  const [state, action] = useActionState<FormState, FormData>(setVariantStock, {});
  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="id" value={variant.id} />
      <label htmlFor={`stock-${variant.id}`} className="sr-only">Stock for {variant.name}</label>
      <Input id={`stock-${variant.id}`} name="stock_quantity" type="number" min="0" step="1" defaultValue={variant.stock_quantity} className="min-h-9 w-24 text-sm" />
      <SubmitButton size="sm" variant="outline" pendingLabel="…">Set</SubmitButton>
      <span aria-live="polite" className="text-xs">
        {state.error ? <span className="text-danger">{state.error}</span> : state.ok ? <span className="text-success">Saved</span> : null}
      </span>
    </form>
  );
}

function VariantForm({ productId, variant, onDone }: { productId: string; variant?: VariantValues; onDone: () => void }) {
  const [state, action] = useActionState<FormState, FormData>(async (prev: FormState, fd: FormData) => {
    const result = await saveVariant(prev, fd);
    if (result.ok) onDone();
    return result;
  }, {});
  const err = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4 rounded-lg border bg-muted/40 p-4" noValidate>
      <input type="hidden" name="product_id" value={productId} />
      {variant ? <input type="hidden" name="id" value={variant.id} /> : null}
      <FormStatus state={{ error: state.error }} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Name" name="name" required defaultValue={variant?.name ?? ""} placeholder="2-3Y / Blue" error={err.name} id={`v-name-${variant?.id ?? "new"}`} />
        <Field label="SKU" name="sku" required defaultValue={variant?.sku ?? ""} error={err.sku} id={`v-sku-${variant?.id ?? "new"}`} />
        <Field label="Stock" name="stock_quantity" type="number" min="0" step="1" required defaultValue={variant?.stock_quantity ?? 0} error={err.stock_quantity} id={`v-stock-${variant?.id ?? "new"}`} />
        <Field label="Price" name="price" type="number" step="0.01" min="0" defaultValue={variant?.price ?? ""} error={err.price} hint="Blank uses the product price." id={`v-price-${variant?.id ?? "new"}`} />
        <TextareaField
          label="Options"
          name="options"
          rows={2}
          defaultValue={formatKeyValues(variant?.options)}
          hint="One per line, like “Size: 2-3Y”. These become the size and colour pickers."
          className="sm:col-span-2"
          id={`v-options-${variant?.id ?? "new"}`}
        />
        <Field label="Sort order" name="sort_order" type="number" min="0" step="1" defaultValue={variant?.sort_order ?? 0} id={`v-sort-${variant?.id ?? "new"}`} />
        <div className="space-y-2">
          <CheckboxField name="is_active" label="For sale" defaultChecked={variant?.is_active ?? true} />
          <CheckboxField name="is_default" label="Selected first" defaultChecked={variant?.is_default ?? false} />
        </div>
      </div>
      <div className="flex gap-2">
        <SubmitButton size="sm" pendingLabel="Saving…">{variant ? "Save variant" : "Add variant"}</SubmitButton>
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>Cancel</Button>
      </div>
    </form>
  );
}

export function VariantEditor({ productId, basePrice, currency, variants }: { productId: string; basePrice: number; currency: string; variants: VariantValues[] }) {
  const [editing, setEditing] = useState<string | null>(null);
  return (
    <div className="space-y-4">
      {variants.length === 0 ? (
        <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">This product has no variants, so shoppers can&apos;t buy it. Add one below.</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {variants.map((v) =>
            editing === v.id ? (
              <li key={v.id} className="p-3">
                <VariantForm productId={productId} variant={v} onDone={() => setEditing(null)} />
              </li>
            ) : (
              <li key={v.id} className="flex flex-wrap items-center gap-x-6 gap-y-3 p-3 text-sm">
                <div className="min-w-40 flex-1">
                  <p className="font-medium">
                    {v.name} {v.is_default ? <Badge variant="neutral" className="ml-1">First</Badge> : null}
                    {!v.is_active ? <Badge variant="warning" className="ml-1">Not for sale</Badge> : null}
                  </p>
                  <p className="text-muted-foreground">
                    {v.sku} · {formatMoney(v.price ?? basePrice, currency)}
                    {Object.keys(v.options).length ? ` · ${Object.entries(v.options).map(([k, val]) => `${k}: ${val}`).join(", ")}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {v.stock_quantity === 0 ? <Badge variant="danger">Sold out</Badge> : v.stock_quantity <= 5 ? <Badge variant="warning">Low</Badge> : null}
                  <StockCell variant={v} />
                </div>
                <div className="flex gap-1">
                  <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(v.id)} aria-label={`Edit ${v.name}`}>
                    <Pencil aria-hidden /> Edit
                  </Button>
                  <form action={deleteVariant}>
                    <input type="hidden" name="id" value={v.id} />
                    <ConfirmButton size="sm" variant="ghost" className="text-danger" message={`Delete variant ${v.name}? Carts holding it lose the item.`} aria-label={`Delete ${v.name}`}>
                      <Trash2 aria-hidden />
                    </ConfirmButton>
                  </form>
                </div>
              </li>
            ),
          )}
        </ul>
      )}
      {editing === "new" ? (
        <VariantForm productId={productId} onDone={() => setEditing(null)} />
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={() => setEditing("new")}>
          <Plus aria-hidden /> Add size or variant
        </Button>
      )}
    </div>
  );
}
