"use client";

import { Maximize2, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { buildReceipt } from "@/features/orders/receipt";
import type { Order } from "@/features/orders/types";
import { ReceiptFullView } from "./receipt-full-view";
import type { ReceiptScene } from "./receipt-scene";

type ReceiptOrder = Pick<
  Order,
  "id" | "order_number" | "created_at" | "currency" | "items" | "subtotal" | "shipping_amount" | "shipping_method_name" | "discount_amount" | "tax_amount" | "total_amount"
>;

// A 3D thermal printer that prints the order's receipt after a successful payment, tears it off
// and opens it full screen. The printer is decorative; the full-screen receipt is real text, and
// the complete order summary is rendered below it on the page.
export function ReceiptPrinter({ order }: { order: ReceiptOrder }) {
  const stage = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<ReceiptScene | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "unsupported">("loading");
  const [animated, setAnimated] = useState(false);
  const [open, setOpen] = useState(false);
  const fullReceipt = useMemo(() => buildReceipt(order, { maxItems: order.items.length }), [order]);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    let canceled = false;
    const animate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const loaded = import("./receipt-scene");
    // Start printing only once the printer is on screen, so the shopper sees it happen.
    const seen = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        seen.disconnect();
        loaded
          .then(({ mountReceiptScene }) => {
            if (canceled) return;
            const scene = mountReceiptScene(el, buildReceipt(order), { animate, onTorn: () => setOpen(true) });
            sceneRef.current = scene;
            setAnimated(animate);
            setState(scene ? "ready" : "unsupported");
          })
          .catch(() => !canceled && setState("unsupported"));
      },
      { threshold: 0.4 },
    );
    seen.observe(el);
    return () => {
      canceled = true;
      seen.disconnect();
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, [order]);

  const printAgain = () => {
    setOpen(false);
    sceneRef.current?.replay();
  };

  if (state === "unsupported") return null;

  return (
    <section
      aria-label="Your receipt"
      className="relative overflow-hidden rounded-xl border bg-[radial-gradient(110%_85%_at_50%_10%,#ffffff_0%,var(--sand)_70%)]"
    >
      <div
        ref={stage}
        role="img"
        aria-label={`A printer printing and tearing off the receipt for order ${order.order_number}. Use View receipt to read it, or see the order summary below.`}
        className="h-[26rem] w-full touch-pan-y sm:h-[32rem]"
      />
      {state === "loading" ? (
        <div aria-hidden className="absolute inset-0 grid place-items-center">
          <div className="h-24 w-40 animate-pulse rounded-2xl bg-foreground/5" />
        </div>
      ) : null}
      {state === "ready" ? (
        <div className="absolute top-3 right-3 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={() => setOpen(true)} className={chip}>
            <Maximize2 className="size-4" aria-hidden />
            View receipt
          </button>
          {animated ? (
            <button type="button" onClick={printAgain} className={chip}>
              <RotateCcw className="size-4" aria-hidden />
              Print again
            </button>
          ) : null}
        </div>
      ) : null}
      <ReceiptFullView receipt={fullReceipt} open={open} onOpenChange={setOpen} onPrintAgain={animated ? printAgain : undefined} />
    </section>
  );
}

const chip =
  "inline-flex min-h-9 items-center gap-1.5 rounded-full border bg-card/80 px-3.5 text-sm font-medium text-foreground backdrop-blur transition-colors outline-none hover:border-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50";
