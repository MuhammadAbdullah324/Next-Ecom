"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import type { Promotion } from "@/features/catalog/types";
import { cn } from "@/lib/utils";
import { HeroSlide } from "./promo-blocks";

const INTERVAL_MS = 6000;

// Several hero banners on one page play as a carousel. Autoplay pauses on hover and focus,
// has a pause button, and is off for people who prefer reduced motion.
export function HeroCarousel({ slides, size, headingFirst = "h2" }: { slides: Promotion[]; size: "full" | "compact"; headingFirst?: "h1" | "h2" }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const root = useRef<HTMLElement>(null);
  const count = slides.length;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const go = useCallback((next: number) => setIndex(((next % count) + count) % count), [count]);

  useEffect(() => {
    if (!playing || hovered || reducedMotion) return;
    const timer = window.setTimeout(() => go(index + 1), INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [index, playing, hovered, reducedMotion, go]);

  const control = "grid size-11 place-items-center rounded-full bg-white/90 text-foreground shadow-sm transition hover:bg-white";

  return (
    <section
      ref={root}
      aria-roledescription="carousel"
      aria-label="Featured offers"
      className={cn("relative", size === "compact" && "overflow-hidden rounded-xl")}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={(e) => {
        if (!root.current?.contains(e.relatedTarget as Node | null)) setHovered(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") go(index - 1);
        if (e.key === "ArrowRight") go(index + 1);
      }}
    >
      <div className="overflow-hidden">
        <div className="flex transition-transform duration-700 ease-out motion-reduce:transition-none" style={{ transform: `translateX(-${index * 100}%)` }} aria-live={playing && !hovered ? "off" : "polite"}>
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              aria-hidden={i !== index}
              inert={i !== index}
              className="w-full shrink-0"
            >
              <HeroSlide promo={slide} size={size} priority={i === 0} heading={i === 0 ? headingFirst : "h2"} />
            </div>
          ))}
        </div>
      </div>

      <div className={cn("absolute flex items-center gap-2", size === "full" ? "bottom-5 right-4 sm:right-6" : "bottom-4 right-4")}>
        <button type="button" className={control} onClick={() => go(index - 1)} aria-label="Previous slide"><ChevronLeft aria-hidden className="size-5" /></button>
        <button type="button" className={control} onClick={() => setPlaying((p) => !p)} aria-label={playing ? "Pause slides" : "Play slides"}>
          {playing ? <Pause aria-hidden className="size-4" /> : <Play aria-hidden className="size-4" />}
        </button>
        <button type="button" className={control} onClick={() => go(index + 1)} aria-label="Next slide"><ChevronRight aria-hidden className="size-5" /></button>
      </div>
      <div className="absolute inset-x-0 top-4 flex justify-center gap-2">
        {slides.map((slide, i) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => go(i)}
            aria-label={`Show slide ${i + 1}: ${slide.title}`}
            aria-current={i === index ? "true" : undefined}
            className="group grid h-6 place-items-center px-0.5"
          >
            <span className={cn("block h-1.5 rounded-full bg-white/60 transition-all group-hover:bg-white", i === index ? "w-8 bg-white" : "w-4")} />
          </button>
        ))}
      </div>
    </section>
  );
}
