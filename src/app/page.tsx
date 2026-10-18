import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { getCategories, getFeaturedProducts, getNewArrivals, getPromotions } from "@/features/catalog/queries";
import { ProductGrid } from "@/components/catalog/product-card";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const tileColors = ["bg-blush", "bg-sky", "bg-secondary", "bg-mint", "bg-blush", "bg-sky", "bg-secondary"];

function SectionHeading({ id, title, href, linkLabel }: { id: string; title: string; href: string; linkLabel: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <h2 id={id} className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
      <Link href={href} className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">
        {linkLabel}
        <ArrowRight aria-hidden className="size-4" />
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
        <p className="bg-foreground px-4 py-2 text-center text-sm text-background">
          <strong>{banner.title}.</strong> {banner.subtitle}
        </p>
      ) : null}

      {hero ? (
        <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
          <div className="grid overflow-hidden rounded-[2rem] bg-secondary md:grid-cols-2">
            <div className="relative flex flex-col justify-center gap-5 px-6 py-12 sm:px-12 md:py-20">
              <Badge variant="default" className="gap-1.5 px-3 py-1 text-xs">
                <Sparkles aria-hidden className="size-3.5" />
                New season
              </Badge>
              <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl">{hero.title}</h1>
              {hero.subtitle ? <p className="max-w-md text-lg text-secondary-foreground">{hero.subtitle}</p> : null}
              <div className="flex flex-wrap gap-3">
                {hero.cta_href ? (
                  <ButtonLink href={hero.cta_href} size="lg">
                    {hero.cta_label ?? "Shop now"}
                    <ArrowRight aria-hidden />
                  </ButtonLink>
                ) : null}
                <ButtonLink href="/category/baby" size="lg" variant="outline">Shop baby</ButtonLink>
              </div>
            </div>
            <div className="relative min-h-72 md:min-h-full">
              {hero.image_url ? <Image src={hero.image_url} alt="" fill priority sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" /> : null}
            </div>
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6" aria-labelledby="categories-heading">
        <SectionHeading id="categories-heading" title="Shop by category" href="/products" linkLabel="All products" />
        <ul className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-7">
          {categories.map((c, i) => (
            <li key={c.id}>
              <Link href={`/category/${c.slug}`} className="group flex flex-col items-center gap-3 rounded-2xl p-1 text-center">
                <span className={`relative block aspect-square w-full overflow-hidden rounded-full ring-4 ring-transparent transition group-hover:ring-primary/30 ${tileColors[i % tileColors.length]}`}>
                  {c.image_url ? (
                    <Image src={c.image_url} alt="" fill sizes="(min-width: 1024px) 14vw, (min-width: 640px) 25vw, 33vw" className="object-cover transition-transform duration-300 group-hover:scale-110" />
                  ) : null}
                </span>
                <span className="text-sm font-bold group-hover:text-primary">{c.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6" aria-labelledby="featured-heading">
        <SectionHeading id="featured-heading" title="Featured" href="/products" linkLabel="See all" />
        <ProductGrid products={featured} />
      </section>

      {secondary.map((promo) => (
        <section key={promo.id} className="mx-auto max-w-7xl px-4 pt-16 sm:px-6">
          <div className="relative overflow-hidden rounded-[2rem] bg-accent">
            {promo.image_url ? (
              <Image src={promo.image_url} alt="" fill sizes="100vw" className="object-cover opacity-90" />
            ) : null}
            <div className="absolute inset-0 bg-linear-to-r from-accent via-accent/85 to-transparent" aria-hidden />
            <div className="relative flex max-w-xl flex-col items-start gap-4 px-6 py-14 sm:px-12">
              <h2 className="text-3xl font-semibold tracking-tight text-accent-foreground sm:text-4xl">{promo.title}</h2>
              {promo.subtitle ? <p className="text-foreground/80">{promo.subtitle}</p> : null}
              {promo.cta_href ? (
                <ButtonLink href={promo.cta_href}>
                  {promo.cta_label ?? "Shop now"}
                  <ArrowRight aria-hidden />
                </ButtonLink>
              ) : null}
            </div>
          </div>
        </section>
      ))}

      <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6" aria-labelledby="new-heading">
        <SectionHeading id="new-heading" title="New arrivals" href="/products?sort=newest" linkLabel="See all" />
        <ProductGrid products={newArrivals} />
      </section>
    </div>
  );
}
