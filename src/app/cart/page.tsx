import type { Metadata } from "next";
import { Suspense } from "react";
import { getCart } from "@/features/cart/queries";
import { amountToFreeShipping } from "@/features/cart/pricing";
import { getShippingMethods, getStoreSettings } from "@/features/checkout/queries";
import { CartLineItem } from "@/components/cart/cart-line";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = { title: "Cart" };

async function CanceledNotice({ searchParams }: { searchParams: PageProps<"/cart">["searchParams"] }) {
  const { payment } = await searchParams;
  if (payment !== "canceled") return null;
  return (
    <Alert variant="info" title="Payment canceled" className="mb-6">
      You have not been charged. Your cart is saved, so you can check out whenever you&apos;re ready.
    </Alert>
  );
}

async function CartContents() {
  const [cart, settings, methods] = await Promise.all([getCart(), getStoreSettings(), getShippingMethods()]);

  if (cart.lines.length === 0) {
    return (
      <div className="rounded-3xl border-2 border-dashed bg-card px-6 py-16 text-center">
        <p className="font-heading text-xl font-semibold">Your cart is empty</p>
        <p className="mt-2 text-sm text-muted-foreground">Find something you like and it will show up here.</p>
        <ButtonLink href="/products" className="mt-6">Start shopping</ButtonLink>
      </div>
    );
  }

  const standard = methods[0];
  const toFree = standard ? amountToFreeShipping(cart.subtotal, standard) : 0;

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
      <ul className="divide-y divide-border rounded-3xl border bg-card px-4 shadow-sm sm:px-6">
        {cart.lines.map((line) => (
          <CartLineItem key={line.id} line={line} currency={settings.currency} />
        ))}
      </ul>

      <aside aria-labelledby="summary-heading" className="h-fit rounded-3xl border bg-card p-6 shadow-sm lg:sticky lg:top-36">
        <h2 id="summary-heading" className="text-lg font-semibold">Order summary</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-foreground/80">Subtotal ({cart.count} {cart.count === 1 ? "item" : "items"})</dt>
            <dd className="font-medium tabular-nums">{formatMoney(cart.subtotal, settings.currency)}</dd>
          </div>
          <div className="flex justify-between text-foreground/80">
            <dt>Delivery and tax</dt>
            <dd>Calculated at checkout</dd>
          </div>
        </dl>
        {standard?.freeOver != null ? (
          <p className="mt-4 rounded-xl bg-accent px-3 py-2 text-sm text-accent-foreground">
            {toFree > 0 ? <>Add {formatMoney(toFree, settings.currency)} more for free standard delivery.</> : <>You get free standard delivery.</>}
          </p>
        ) : null}
        {cart.problems > 0 ? (
          <p className="mt-4 text-sm text-danger">Fix the highlighted {cart.problems === 1 ? "item" : "items"} to continue.</p>
        ) : null}
        <ButtonLink
          href="/checkout"
          size="lg"
          className={`mt-6 w-full ${cart.problems > 0 ? "pointer-events-none opacity-50" : ""}`}
          aria-disabled={cart.problems > 0}
          tabIndex={cart.problems > 0 ? -1 : undefined}
        >
          Go to checkout
        </ButtonLink>
        <p className="mt-3 text-center text-xs text-muted-foreground">No account needed. You can check out as a guest.</p>
      </aside>
    </div>
  );
}

export default function CartPage({ searchParams }: PageProps<"/cart">) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-3xl font-semibold tracking-tight sm:text-4xl">Your cart</h1>
      <Suspense fallback={null}>
        <CanceledNotice searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={<div className="space-y-4"><Skeleton className="h-28" /><Skeleton className="h-28" /></div>}>
        <CartContents />
      </Suspense>
    </div>
  );
}
