import clsx from "clsx";
import type { ReactNode } from "react";
import type { Tone } from "@/features/orders/status";

const tones: Record<Tone | "brand", string> = {
  neutral: "bg-line text-ink-soft",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  brand: "bg-brand-soft text-brand-strong",
};

export function Badge({ tone = "neutral", children, className }: { tone?: Tone | "brand"; children: ReactNode; className?: string }) {
  return <span className={clsx("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", tones[tone], className)}>{children}</span>;
}
