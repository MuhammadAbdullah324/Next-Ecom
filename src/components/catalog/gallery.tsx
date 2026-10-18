"use client";

import Image from "next/image";
import { useState } from "react";
import clsx from "clsx";
import type { ProductImage } from "@/features/catalog/types";

export function Gallery({ images, name }: { images: ProductImage[]; name: string }) {
  const [index, setIndex] = useState(0);
  const current = images[index];
  if (!current) return <div className="aspect-[4/5] rounded-xl bg-muted" />;

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-muted">
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
              className={clsx("relative aspect-[4/5] w-20 overflow-hidden rounded-md bg-muted ring-offset-2 transition", i === index ? "ring-2 ring-foreground" : "opacity-70 hover:opacity-100")}
            >
              <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
