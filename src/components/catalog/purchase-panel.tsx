"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { addToCart, type CartActionState } from "@/features/cart/actions";
import { defaultVariant, isValueAvailable, optionNames, optionValues, selectOption } from "@/features/catalog/variants";
import type { ProductVariant } from "@/features/catalog/types";
import { Price } from "@/components/ui/price";
import { SubmitButton } from "@/components/ui/submit-button";
import { QuantityStepper } from "@/components/cart/quantity-stepper";

function StockStatus({ stock }: { stock: number }) {
  if (stock <= 0) return <p className="text-sm font-medium text-danger">Out of stock</p>;
  if (stock <= 5) return <p className="text-sm font-medium text-warning">Only {stock} left in stock</p>;
  return <p className="text-sm font-medium text-success">In stock, ready to ship</p>;
}

export function PurchasePanel({ variants, compareAt }: { variants: ProductVariant[]; compareAt: number | null }) {
  const [variant, setVariant] = useState(() => defaultVariant(variants));
  const [quantity, setQuantity] = useState(1);
  const [state, formAction] = useActionState<CartActionState, FormData>(addToCart, {});
  const names = optionNames(variants);
  const maxQuantity = Math.max(1, Math.min(variant.stock_quantity, 99));
  const soldOut = variant.stock_quantity <= 0;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Price amount={variant.price} compareAt={compareAt} size="lg" />
        <StockStatus stock={variant.stock_quantity} />
      </div>

      {names.map((name) => (
        <fieldset key={name}>
          <legend className="font-heading text-sm font-semibold">
            {name}: <span className="font-normal text-foreground/80">{variant.options[name]}</span>
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {optionValues(variants, name).map((value) => {
              const selected = variant.options[name] === value;
              const available = isValueAvailable(variants, variant.options, name, value);
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    const next = selectOption(variants, variant.options, name, value);
                    if (next) {
                      setVariant(next);
                      setQuantity(1);
                    }
                  }}
                  className={clsx(
                    "min-h-11 min-w-14 rounded-full border-2 px-4 text-sm font-bold transition-colors",
                    selected ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border bg-card hover:border-primary/50",
                    !available && !selected && "text-muted-foreground line-through decoration-1",
                  )}
                >
                  {value}
                  {!available ? <span className="sr-only"> (out of stock)</span> : null}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="variantId" value={variant.id} />
        <input type="hidden" name="quantity" value={quantity} />
        <div className="flex flex-wrap items-center gap-3">
          <QuantityStepper value={quantity} max={maxQuantity} onChange={setQuantity} disabled={soldOut} label="Quantity" />
          <SubmitButton size="lg" className="flex-1 sm:flex-none sm:min-w-56" disabled={soldOut} pendingLabel="Adding…">
            {soldOut ? "Out of stock" : "Add to cart"}
          </SubmitButton>
        </div>
        <div aria-live="polite" className="min-h-6 text-sm">
          {state.error ? <p className="text-danger">{state.error}</p> : null}
          {state.ok ? (
            <p className="text-success">
              {state.message}.{" "}
              <Link href="/cart" className="font-medium underline">
                View cart
              </Link>
            </p>
          ) : null}
        </div>
      </form>
    </div>
  );
}
