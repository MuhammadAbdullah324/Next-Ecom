"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useRef } from "react";
import { removeFromCart, updateCartQuantity, type CartActionState } from "@/features/cart/actions";
import type { CartLine } from "@/features/cart/queries";
import { formatMoney } from "@/lib/money";

export function CartLineItem({ line, currency }: { line: CartLine; currency: string }) {
  const [updateState, update, updating] = useActionState<CartActionState, FormData>(updateCartQuantity, {});
  const [removeState, remove, removing] = useActionState<CartActionState, FormData>(removeFromCart, {});
  const qtyRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const tooMany = line.available && line.quantity > line.stock;
  const max = Math.max(1, Math.min(99, line.stock));

  const setQuantity = (next: number) => {
    if (!qtyRef.current || !formRef.current) return;
    qtyRef.current.value = String(next);
    formRef.current.requestSubmit();
  };

  return (
    <li className="flex gap-4 py-6" aria-busy={updating || removing}>
      <div className="relative aspect-[4/5] w-24 shrink-0 overflow-hidden rounded-md bg-muted sm:w-28">
        {line.imageUrl ? <Image src={line.imageUrl} alt={line.imageAlt} fill sizes="112px" className="object-cover" /> : null}
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex justify-between gap-4">
          <div>
            {line.productSlug ? (
              <Link href={`/products/${line.productSlug}`} className="font-medium hover:underline">{line.productName}</Link>
            ) : (
              <p className="font-medium">{line.productName}</p>
            )}
            {line.hasOptions ? <p className="text-sm text-muted-foreground">{line.variantName}</p> : null}
            <p className="text-sm text-muted-foreground">{formatMoney(line.unitPrice, currency)} each</p>
          </div>
          <p className="font-semibold tabular-nums">{line.available ? formatMoney(line.unitPrice * line.quantity, currency) : "–"}</p>
        </div>

        {!line.available ? (
          <p className="text-sm text-danger">This item is no longer available. Remove it to check out.</p>
        ) : tooMany ? (
          <p className="text-sm text-warning">Only {line.stock} left. Lower the quantity to check out.</p>
        ) : null}

        <div className="mt-auto flex items-center gap-3">
          {line.available && line.stock > 0 ? (
            <form ref={formRef} action={update} className="inline-flex items-center rounded-md border border-input bg-card">
              <input type="hidden" name="variantId" value={line.variantId} />
              <input ref={qtyRef} type="hidden" name="quantity" defaultValue={line.quantity} />
              <button type="button" className="inline-flex size-11 items-center justify-center text-lg disabled:text-muted-foreground" onClick={() => setQuantity(line.quantity > max ? max : line.quantity - 1)} disabled={updating || line.quantity <= 1} aria-label={`Decrease quantity of ${line.productName}`}>
                −
              </button>
              <span className="min-w-8 text-center text-sm font-medium tabular-nums" aria-label="Quantity">{line.quantity}</span>
              <button type="button" className="inline-flex size-11 items-center justify-center text-lg disabled:text-muted-foreground" onClick={() => setQuantity(line.quantity + 1)} disabled={updating || line.quantity >= max} aria-label={`Increase quantity of ${line.productName}`}>
                +
              </button>
            </form>
          ) : null}
          <form action={remove}>
            <input type="hidden" name="variantId" value={line.variantId} />
            <button type="submit" disabled={removing} className="min-h-11 rounded-md px-3 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
              {removing ? "Removing…" : "Remove"}
            </button>
          </form>
        </div>
        <div aria-live="polite" className="text-sm text-danger">{updateState.error ?? removeState.error}</div>
      </div>
    </li>
  );
}
