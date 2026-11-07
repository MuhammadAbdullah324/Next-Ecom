"use client";

import { Dialog } from "radix-ui";
import { RotateCcw, X } from "lucide-react";
import { useRef } from "react";
import type { Receipt } from "@/features/orders/receipt";

type Props = {
  receipt: Receipt;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPrintAgain?: () => void;
};

// The torn-off receipt, full screen, as real text so it can be read, zoomed and selected.
export function ReceiptFullView({ receipt, open, onOpenChange, onPrintAgain }: Props) {
  const content = useRef<HTMLDivElement>(null);
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/45 backdrop-blur-sm data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content
          ref={content}
          aria-describedby={undefined}
          // It opens on its own after the tear, so focus the sheet rather than ringing the close button.
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            content.current?.focus();
          }}
          className="fixed inset-0 z-50 flex flex-col items-center overflow-y-auto px-4 py-6 outline-none sm:py-10"
          onClick={(e) => {
            if (e.target === e.currentTarget) onOpenChange(false); // tap outside the paper closes it
          }}
        >
          <Dialog.Close
            aria-label="Close receipt"
            className="fixed top-3 right-3 z-10 grid size-11 place-items-center rounded-full bg-card text-foreground shadow-md outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <X className="size-5" aria-hidden />
          </Dialog.Close>

          <div className="receipt-arrive my-auto w-full max-w-md drop-shadow-[0_24px_40px_rgba(24,24,27,0.28)]">
            <article className="receipt-zigzag bg-[#fbfaf6] px-7 pt-10 pb-12 font-mono text-[#23252a] sm:px-9">
              <header className="text-center">
                <Dialog.Title className="text-3xl font-extrabold tracking-wider">{receipt.store}</Dialog.Title>
                <p className="mt-1 text-xs tracking-widest text-[#23252a]/65">{receipt.stamp.replace(/\s+/g, " ")}</p>
              </header>
              <hr className="my-5 border-0 border-t-2 border-dashed border-[#23252a]/45" />
              <ul className="space-y-2.5 text-sm">
                {receipt.items.map((item, i) => (
                  <li key={i} className="flex items-baseline justify-between gap-4">
                    <span className="min-w-0">{item.label}</span>
                    <span className="shrink-0 font-semibold tabular-nums">{item.amount}</span>
                  </li>
                ))}
              </ul>
              <hr className="my-5 border-0 border-t-2 border-dashed border-[#23252a]/45" />
              <dl className="space-y-1.5 text-sm text-[#23252a]/80">
                {receipt.charges.map((c) => (
                  <div key={c.label} className="flex justify-between gap-4">
                    <dt>{c.label}</dt>
                    <dd className="tabular-nums">{c.amount}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-4 flex items-baseline justify-between border-t-2 border-[#23252a]/70 pt-3 text-xl font-extrabold">
                <span>{receipt.total.label}</span>
                <span className="tabular-nums">{receipt.total.amount}</span>
              </div>
              <hr className="my-5 border-0 border-t-2 border-dashed border-[#23252a]/45" />
              <footer className="text-center text-xs tracking-widest">
                <p>ORDER {receipt.orderNumber}</p>
                <Barcode value={receipt.orderNumber} />
                <p className="mt-4">THANK YOU FOR SHOPPING</p>
                <p className="mt-1 text-[#23252a]/60">tiny clothes, big adventures</p>
              </footer>
            </article>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {onPrintAgain ? (
              <button
                type="button"
                onClick={onPrintAgain}
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-card px-5 text-sm font-medium text-foreground shadow-md outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <RotateCcw className="size-4" aria-hidden />
                Print again
              </button>
            ) : null}
            <Dialog.Close className="inline-flex min-h-11 items-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-md outline-none hover:bg-primary/85 focus-visible:ring-[3px] focus-visible:ring-ring/50">
              Done
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// Decorative bars derived from the order number, matching the printed one.
function Barcode({ value }: { value: string }) {
  const code = value.split("").map((c) => c.charCodeAt(0));
  const bars: { x: number; w: number }[] = [];
  let x = 0;
  for (let i = 0; x < 240; i++) {
    const v = code[i % code.length] + i * 7;
    const w = 1.5 + (v % 4);
    if (i % 2 === 0) bars.push({ x, w });
    x += w + 1 + ((v >> 2) % 3);
  }
  return (
    <svg aria-hidden viewBox="0 0 240 44" className="mx-auto mt-3 h-11 w-60 max-w-full" preserveAspectRatio="none">
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y={0} width={b.w} height={44} fill="currentColor" />
      ))}
    </svg>
  );
}
