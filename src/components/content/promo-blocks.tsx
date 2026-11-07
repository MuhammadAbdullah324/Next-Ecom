import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { Promotion } from "@/features/catalog/types";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Presentational blocks for content managed in /admin/content. Safe in server and client components.

export function AnnouncementBar({ banners }: { banners: Promotion[] }) {
  if (banners.length === 0) return null;
  return (
    <div className="bg-foreground px-4 py-2.5 text-center text-xs tracking-wide text-background sm:text-sm">
      {banners.map((b) => (
        <p key={b.id}>
          <strong className="font-semibold">{b.title.replace(/\.$/, "")}.</strong> {b.subtitle}
          {b.cta_href ? (
            <>
              {" "}
              <a href={b.cta_href} className="font-semibold underline underline-offset-4">{b.cta_label ?? "Learn more"}</a>
            </>
          ) : null}
        </p>
      ))}
    </div>
  );
}

// size "full": edge-to-edge home page hero. size "compact": rounded banner inside a page container.
export function HeroSlide({ promo, size, priority, heading = "h2" }: { promo: Promotion; size: "full" | "compact"; priority?: boolean; heading?: "h1" | "h2" }) {
  const Heading = heading;
  const full = size === "full";
  return (
    <div
      className={cn(
        "relative isolate flex h-full items-end overflow-hidden bg-foreground",
        full ? "min-h-[32rem] md:min-h-[38rem] lg:min-h-[44rem]" : "min-h-72 rounded-xl sm:min-h-80",
      )}
    >
      {promo.image_url ? <Image src={promo.image_url} alt="" fill priority={priority} sizes={full ? "100vw" : "(min-width: 1280px) 1232px, 100vw"} className="-z-10 object-cover" /> : null}
      <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-t from-black/70 via-black/25 to-transparent md:bg-linear-to-r md:from-black/65 md:via-black/30" />
      <div className={cn("w-full", full ? "mx-auto max-w-7xl px-4 pb-14 sm:px-6 md:pb-20" : "px-6 pb-8 sm:px-10 sm:pb-10")}>
        <div className={cn("flex max-w-xl flex-col items-start text-white", full ? "gap-5" : "gap-3")}>
          {promo.eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/85">{promo.eyebrow}</p> : null}
          <Heading className={cn("font-semibold", full ? "text-5xl leading-[1.02] sm:text-7xl" : "text-3xl leading-tight sm:text-4xl")}>{promo.title}</Heading>
          {promo.subtitle ? <p className={cn("max-w-md text-white/90", full ? "text-lg" : "text-base")}>{promo.subtitle}</p> : null}
          {promo.cta_href || promo.cta2_href ? (
            <div className={cn("flex flex-wrap gap-3", full && "mt-2")}>
              {promo.cta_href ? (
                <ButtonLink href={promo.cta_href} size={full ? "lg" : "default"} className="bg-white text-foreground hover:bg-white/90">
                  {promo.cta_label ?? "Shop now"}
                  <ArrowRight aria-hidden />
                </ButtonLink>
              ) : null}
              {promo.cta2_href ? (
                <ButtonLink href={promo.cta2_href} size={full ? "lg" : "default"} variant="outline" className="border-white/70 bg-transparent text-white hover:border-white hover:bg-white/10">
                  {promo.cta2_label ?? "Learn more"}
                </ButtonLink>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function FeatureCard({ promo }: { promo: Promotion }) {
  return (
    <div className="grid overflow-hidden rounded-xl bg-sand md:grid-cols-2">
      <div className="relative min-h-72 md:min-h-[26rem]">
        {promo.image_url ? <Image src={promo.image_url} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" /> : null}
      </div>
      <div className="flex flex-col items-start justify-center gap-4 px-6 py-12 sm:px-12">
        {promo.eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sale">{promo.eyebrow}</p> : null}
        <h2 className="text-3xl font-semibold sm:text-4xl">{promo.title}</h2>
        {promo.subtitle ? <p className="max-w-sm text-muted-foreground">{promo.subtitle}</p> : null}
        {promo.cta_href || promo.cta2_href ? (
          <div className="mt-2 flex flex-wrap gap-3">
            {promo.cta_href ? (
              <ButtonLink href={promo.cta_href}>
                {promo.cta_label ?? "Shop now"}
                <ArrowRight aria-hidden />
              </ButtonLink>
            ) : null}
            {promo.cta2_href ? <ButtonLink href={promo.cta2_href} variant="outline">{promo.cta2_label ?? "Learn more"}</ButtonLink> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
