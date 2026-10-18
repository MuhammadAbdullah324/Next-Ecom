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
      <div className="rounded-xl bg-muted px-6 py-20 text-center">
        <p className="text-xl font-semibold">Your cart is empty</p>
        <p className="mt-2 text-sm text-muted-foreground">Find something you like and it will show up here.</p>
        <ButtonLink href="/products" className="mt-6">Start shopping</ButtonLink>
      </div>
    );
  }

  const standard = methods[0];
  const toFree = standard ? amountToFreeShipping(cart.subtotal, standard) : 0;

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_24rem] lg:gap-14">
      <ul className="h-fit divide-y divide-border border-y border-border">
        {cart.lines.map((line) => (
          <CartLineItem key={line.id} line={line} currency={settings.currency} />
        ))}
      </ul>

      <aside aria-labelledby="summary-heading" className="h-fit rounded-xl bg-muted p-6 lg:sticky lg:top-36">
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
          <div className="mt-5 border-t border-foreground/10 pt-5 text-sm">
            <p>{toFree > 0 ? <>Add {formatMoney(toFree, settings.currency)} more for free standard delivery.</> : <>You get free standard delivery.</>}</p>
            <div aria-hidden className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-foreground/10">
              <div className="h-full rounded-full bg-foreground transition-[width]" style={{ width: `${Math.min(100, (cart.subtotal / standard.freeOver) * 100)}%` }} />
            </div>
          </div>
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
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="mb-8 text-3xl font-semibold sm:text-4xl">Your cart</h1>
      <Suspense fallback={null}>
        <CanceledNotice searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={<div className="space-y-4"><Skeleton className="h-28" /><Skeleton className="h-28" /></div>}>
        <CartContents />
      </Suspense>
    </div>
  );
}
