import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getCategories, getFeaturedProducts, getNewArrivals, getPromotions } from "@/features/catalog/queries";
import { ProductGrid } from "@/components/catalog/product-card";
import { ButtonLink } from "@/components/ui/button";

function SectionHeading({ id, title, href, linkLabel }: { id: string; title: string; href: string; linkLabel: string }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <h2 id={id} className="text-2xl font-semibold sm:text-3xl">{title}</h2>
      <Link href={href} className="group inline-flex items-center gap-1 text-sm font-medium underline-offset-4 hover:underline">
        {linkLabel}
        <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}

export default async function HomePage() {
  const [promotions, categories, featured, newArrivals] = await Promise.all([
    getPromotions(),
    getCategories(),
    getFeaturedProducts(8),
    getNewArrivals(4),
  ]);
  const heroes = promotions.filter((p) => p.placement === "hero");
  const hero = heroes[0];
  const secondary = heroes.slice(1);
  const banner = promotions.find((p) => p.placement === "banner");

  return (
    <div>
      {banner ? (
        <p className="bg-foreground px-4 py-2.5 text-center text-xs tracking-wide text-background sm:text-sm">
          <strong className="font-semibold">{banner.title}.</strong> {banner.subtitle}
        </p>
      ) : null}

      {hero ? (
        <section className="relative isolate flex min-h-[32rem] items-end overflow-hidden bg-foreground md:min-h-[38rem] lg:min-h-[44rem]">
          {hero.image_url ? <Image src={hero.image_url} alt="" fill priority sizes="100vw" className="-z-10 object-cover" /> : null}
          <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-t from-black/70 via-black/25 to-transparent md:bg-linear-to-r md:from-black/65 md:via-black/30" />
          <div className="mx-auto w-full max-w-7xl px-4 pb-14 sm:px-6 md:pb-20">
            <div className="flex max-w-xl flex-col items-start gap-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/85">New season</p>
              <h1 className="text-5xl font-semibold leading-[1.02] sm:text-7xl">{hero.title}</h1>
              {hero.subtitle ? <p className="max-w-md text-lg text-white/90">{hero.subtitle}</p> : null}
              <div className="mt-2 flex flex-wrap gap-3">
                {hero.cta_href ? (
                  <ButtonLink href={hero.cta_href} size="lg" className="bg-white text-foreground hover:bg-white/90">
                    {hero.cta_label ?? "Shop now"}
                    <ArrowRight aria-hidden />
                  </ButtonLink>
                ) : null}
                <ButtonLink href="/category/baby" size="lg" variant="outline" className="border-white/70 bg-transparent text-white hover:border-white hover:bg-white/10">Shop baby</ButtonLink>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6" aria-labelledby="categories-heading">
        <SectionHeading id="categories-heading" title="Shop by category" href="/products" linkLabel="All products" />
        <ul className="-mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-4 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-7 [scrollbar-width:none]">
          {categories.map((c) => (
            <li key={c.id} className="w-36 shrink-0 snap-start sm:w-auto">
              <Link href={`/category/${c.slug}`} className="group block">
                <span className="relative block aspect-[3/4] overflow-hidden rounded-lg bg-muted">
                  {c.image_url ? (
                    <Image src={c.image_url} alt="" fill sizes="(min-width: 1024px) 14vw, (min-width: 640px) 25vw, 144px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : null}
                </span>
                <span className="mt-3 flex items-center justify-between gap-1 text-sm font-medium">
                  {c.name}
                  <ArrowRight aria-hidden className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6" aria-labelledby="featured-heading">
        <SectionHeading id="featured-heading" title="Featured" href="/products" linkLabel="See all" />
        <ProductGrid products={featured} />
      </section>

      {secondary.map((promo) => (
        <section key={promo.id} className="mx-auto max-w-7xl px-4 pt-20 sm:px-6">
          <div className="grid overflow-hidden rounded-xl bg-sand md:grid-cols-2">
            <div className="relative min-h-72 md:min-h-[26rem]">
              {promo.image_url ? <Image src={promo.image_url} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" /> : null}
            </div>
            <div className="flex flex-col items-start justify-center gap-4 px-6 py-12 sm:px-12">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sale">Limited time</p>
              <h2 className="text-3xl font-semibold sm:text-4xl">{promo.title}</h2>
              {promo.subtitle ? <p className="max-w-sm text-muted-foreground">{promo.subtitle}</p> : null}
              {promo.cta_href ? (
                <ButtonLink href={promo.cta_href} className="mt-2">
                  {promo.cta_label ?? "Shop now"}
                  <ArrowRight aria-hidden />
                </ButtonLink>
              ) : null}
            </div>
          </div>
        </section>
      ))}

      <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6" aria-labelledby="new-heading">
        <SectionHeading id="new-heading" title="New arrivals" href="/products?sort=newest" linkLabel="See all" />
        <ProductGrid products={newArrivals} />
      </section>
    </div>
  );
}
