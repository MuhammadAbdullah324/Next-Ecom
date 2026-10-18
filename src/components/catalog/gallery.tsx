"use client";

import Image from "next/image";
import { useState } from "react";
import clsx from "clsx";
import type { ProductImage } from "@/features/catalog/types";

export function Gallery({ images, name }: { images: ProductImage[]; name: string }) {
  const [index, setIndex] = useState(0);
  const current = images[index];
  if (!current) return <div className="aspect-square rounded-3xl border bg-card shadow-sm" />;

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-3xl bg-muted">
        <Image src={current.url} alt={current.alt_text} fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
      </div>
      {images.length > 1 ? (
        <div className="flex gap-3" role="group" aria-label={`${name} images`}>
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show image ${i + 1} of ${images.length}`}
              aria-current={i === index}
              className={clsx("relative size-20 overflow-hidden rounded-2xl border-2 bg-muted", i === index ? "border-primary" : "border-transparent hover:border-border")}
            >
              <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
