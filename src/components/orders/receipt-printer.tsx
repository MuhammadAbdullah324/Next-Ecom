"use client";

import { RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { buildReceipt } from "@/features/orders/receipt";
import type { Order } from "@/features/orders/types";
import type { ReceiptScene } from "./receipt-scene";

type ReceiptOrder = Pick<
  Order,
  "id" | "order_number" | "created_at" | "currency" | "items" | "subtotal" | "shipping_amount" | "shipping_method_name" | "discount_amount" | "tax_amount" | "total_amount"
>;

// A 3D thermal printer that prints the order's receipt after a successful payment.
// Decorative: the full, accessible order summary is rendered next to it on the page.
export function ReceiptPrinter({ order }: { order: ReceiptOrder }) {
  const stage = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<ReceiptScene | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "unsupported">("loading");
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    let canceled = false;
    const animate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    import("./receipt-scene")
      .then(({ mountReceiptScene }) => {
        if (canceled) return;
        const scene = mountReceiptScene(el, buildReceipt(order), { animate });
        sceneRef.current = scene;
        setAnimated(animate);
        setState(scene ? "ready" : "unsupported");
      })
      .catch(() => !canceled && setState("unsupported"));
    return () => {
      canceled = true;
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, [order]);

  if (state === "unsupported") return null;

  return (
    <section
      aria-label="Your receipt"
      className="relative overflow-hidden rounded-xl bg-[radial-gradient(120%_90%_at_50%_15%,#2b3448_0%,#141a26_55%,#0b0f17_100%)]"
    >
      <div
        ref={stage}
        role="img"
        aria-label={`A printer printing the receipt for order ${order.order_number}. The full order summary follows below.`}
        className="h-[26rem] w-full touch-pan-y sm:h-[32rem]"
      />
      {state === "loading" ? (
        <div aria-hidden className="absolute inset-0 grid place-items-center">
          <div className="h-24 w-40 animate-pulse rounded-2xl bg-white/5" />
        </div>
      ) : null}
      {state === "ready" && animated ? (
        <button
          type="button"
          onClick={() => sceneRef.current?.replay()}
          className="absolute top-3 right-3 inline-flex min-h-9 items-center gap-1.5 rounded-full bg-white/10 px-3.5 text-sm font-medium text-white backdrop-blur transition-colors outline-none hover:bg-white/20 focus-visible:ring-[3px] focus-visible:ring-white/50"
        >
          <RotateCcw className="size-4" aria-hidden />
          Print again
        </button>
      ) : null}
    </section>
  );
}
