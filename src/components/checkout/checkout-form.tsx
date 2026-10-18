"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useState } from "react";
import clsx from "clsx";
import { startCheckout, type CheckoutState } from "@/features/checkout/actions";
import { orderTotals, type ShippingMethod } from "@/features/cart/pricing";
import type { SavedAddress } from "@/features/checkout/queries";
import type { CartLine } from "@/features/cart/queries";
import { Field } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatMoney } from "@/lib/money";

type Props = {
  isGuest: boolean;
  email: string | null;
  addresses: SavedAddress[];
  methods: ShippingMethod[];
  lines: CartLine[];
  subtotal: number;
  currency: string;
  taxRate: number;
};

function deliveryWindow(m: ShippingMethod) {
  return m.minDays === m.maxDays ? `${m.minDays} business day${m.minDays === 1 ? "" : "s"}` : `${m.minDays}–${m.maxDays} business days`;
}

export function CheckoutForm({ isGuest, email, addresses, methods, lines, subtotal, currency, taxRate }: Props) {
  const [state, formAction] = useActionState<CheckoutState, FormData>(startCheckout, {});
  const [mode, setMode] = useState<"saved" | "new">(addresses.length > 0 ? "saved" : "new");
  const [methodCode, setMethodCode] = useState(methods[0]?.code ?? "");
  const method = methods.find((m) => m.code === methodCode) ?? methods[0];
  const totals = method ? orderTotals(subtotal, method, taxRate) : null;
  const err = state.fieldErrors ?? {};
  const money = (n: number) => formatMoney(n, currency);

  return (
    <form action={formAction} className="grid gap-10 lg:grid-cols-[1fr_24rem]" noValidate>
      <div className="space-y-10">
        {state.error ? <Alert variant="destructive" title="We couldn't place your order">{state.error}</Alert> : null}

        <section aria-labelledby="contact-heading" className="space-y-4">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="contact-heading" className="text-lg font-semibold">1. Contact</h2>
            {isGuest ? (
              <p className="text-sm text-muted-foreground">
                Have an account? <Link href="/sign-in?next=/checkout" className="font-medium text-primary hover:underline">Sign in</Link>
              </p>
            ) : null}
          </div>
          {isGuest ? (
            <Field label="Email" name="email" type="email" autoComplete="email" required error={err.email} hint="We'll send your order confirmation here." />
          ) : (
            <p className="rounded-2xl border bg-card px-4 py-3 text-sm">
              Confirmation goes to <strong>{email}</strong>
            </p>
          )}
        </section>

        <section aria-labelledby="address-heading" className="space-y-4">
          <h2 id="address-heading" className="text-lg font-semibold">2. Delivery address</h2>
          <input type="hidden" name="addressMode" value={mode} />
          {addresses.length > 0 ? (
            <fieldset className="space-y-3">
              <legend className="sr-only">Choose a saved address</legend>
              {addresses.map((a, i) => (
                <label key={a.id} className={clsx("flex cursor-pointer gap-3 rounded-2xl border bg-card p-4 text-sm", mode === "saved" ? "has-checked:border-primary has-checked:ring-2 has-checked:ring-primary/25 has-checked:bg-accent/40" : "border-border")}>
                  <input type="radio" name="savedAddressId" value={a.id} defaultChecked={i === 0} onChange={() => setMode("saved")} className="mt-1 size-4 accent-primary" />
                  <span>
                    <span className="font-medium">{a.label ? `${a.label}: ` : ""}{a.full_name}</span>
                    <span className="block text-foreground/80">
                      {a.address_line_1}
                      {a.address_line_2 ? `, ${a.address_line_2}` : ""}, {a.city} {a.postal_code}, {a.country}
                    </span>
                  </span>
                </label>
              ))}
              <button type="button" onClick={() => setMode(mode === "new" ? "saved" : "new")} className="text-sm font-medium text-primary hover:underline" aria-expanded={mode === "new"}>
                {mode === "new" ? "Use a saved address" : "+ Deliver to a new address"}
              </button>
            </fieldset>
          ) : null}

          {mode === "new" ? (
            <div className="grid gap-4 rounded-3xl border bg-card shadow-sm p-4 sm:grid-cols-2 sm:p-6">
              <Field label="Full name" name="full_name" autoComplete="name" required error={err.full_name} className="sm:col-span-2" />
              <Field label="Phone" name="phone" type="tel" autoComplete="tel" required error={err.phone} className="sm:col-span-2" hint="For delivery updates only." />
              <Field label="Address" name="address_line_1" autoComplete="address-line1" required error={err.address_line_1} className="sm:col-span-2" />
              <Field label="Apartment, suite, etc." name="address_line_2" autoComplete="address-line2" error={err.address_line_2} className="sm:col-span-2" />
              <Field label="City" name="city" autoComplete="address-level2" required error={err.city} />
              <Field label="State or province" name="state" autoComplete="address-level1" error={err.state} />
              <Field label="Postal code" name="postal_code" autoComplete="postal-code" required error={err.postal_code} />
              <Field label="Country" name="country" autoComplete="country-name" required defaultValue="Pakistan" error={err.country} />
              {!isGuest ? (
                <label className="flex items-center gap-2 text-sm sm:col-span-2">
                  <input type="checkbox" name="saveAddress" defaultChecked className="size-4 accent-primary" />
                  Save this address for next time
                </label>
              ) : null}
            </div>
          ) : null}
        </section>

        <section aria-labelledby="delivery-heading" className="space-y-4">
          <h2 id="delivery-heading" className="text-lg font-semibold">3. Delivery method</h2>
          <fieldset className="space-y-3">
            <legend className="sr-only">Choose a delivery method</legend>
            {methods.map((m) => {
              const cost = orderTotals(subtotal, m, 0).shipping;
              return (
                <label key={m.code} className="flex cursor-pointer items-start justify-between gap-3 rounded-2xl border bg-card p-4 text-sm has-checked:border-primary has-checked:ring-2 has-checked:ring-primary/25 has-checked:bg-accent/40">
                  <span className="flex gap-3">
                    <input type="radio" name="shippingMethod" value={m.code} checked={methodCode === m.code} onChange={() => setMethodCode(m.code)} className="mt-1 size-4 accent-primary" />
                    <span>
                      <span className="font-medium">{m.name}</span>
                      <span className="block text-foreground/80">{deliveryWindow(m)}{m.freeOver != null ? `. Free over ${money(m.freeOver)}` : ""}</span>
                    </span>
                  </span>
                  <span className="font-medium">{cost === 0 ? "Free" : money(cost)}</span>
                </label>
              );
            })}
          </fieldset>
          {err.shippingMethod ? <p className="text-sm text-danger">{err.shippingMethod}</p> : null}
        </section>
      </div>

      <aside aria-labelledby="checkout-summary" className="h-fit rounded-3xl border bg-card p-6 shadow-sm lg:sticky lg:top-36">
        <h2 id="checkout-summary" className="text-lg font-semibold">Order summary</h2>
        <ul className="mt-4 space-y-3">
          {lines.map((line) => (
            <li key={line.id} className="flex gap-3 text-sm">
              <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-border">
                {line.imageUrl ? <Image src={line.imageUrl} alt="" fill sizes="56px" className="object-cover" /> : null}
                <span className="absolute right-0.5 top-0.5 rounded-full bg-foreground px-1.5 text-xs text-white">{line.quantity}</span>
              </div>
              <div className="flex-1">
                <p className="font-medium leading-snug">{line.productName}</p>
                {line.hasOptions ? <p className="text-muted-foreground">{line.variantName}</p> : null}
              </div>
              <p className="tabular-nums">{money(line.unitPrice * line.quantity)}</p>
            </li>
          ))}
        </ul>
        {totals ? (
          <dl className="mt-6 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-foreground/80">Subtotal</dt><dd className="tabular-nums">{money(totals.subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-foreground/80">Delivery</dt><dd className="tabular-nums">{totals.shipping === 0 ? "Free" : money(totals.shipping)}</dd></div>
            <div className="flex justify-between"><dt className="text-foreground/80">Tax ({Math.round(taxRate * 1000) / 10}%)</dt><dd className="tabular-nums">{money(totals.tax)}</dd></div>
            <div className="flex justify-between border-t border-border pt-3 text-base font-semibold"><dt>Total</dt><dd className="tabular-nums">{money(totals.total)}</dd></div>
          </dl>
        ) : null}
        <SubmitButton size="lg" className="mt-6 w-full" pendingLabel="Taking you to payment…">
          Continue to payment
        </SubmitButton>
        <p className="mt-3 text-center text-xs text-muted-foreground">You&apos;ll pay securely on Stripe. Prices and stock are confirmed when you continue.</p>
      </aside>
    </form>
  );
}
