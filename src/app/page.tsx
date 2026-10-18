import Image from "next/image";
import Link from "next/link";
import { getCategories, getFeaturedProducts, getNewArrivals, getPromotions } from "@/features/catalog/queries";
import { ProductGrid } from "@/components/catalog/product-card";
import { ButtonLink } from "@/components/ui/button";

export default async function HomePage() {
  const [promotions, categories, featured, newArrivals] = await Promise.all([
    getPromotions(),
    getCategories(),
    getFeaturedProducts(8),
    getNewArrivals(4),
  ]);
  const hero = promotions.find((p) => p.placement === "hero");
  const secondary = promotions.filter((p) => p.placement === "hero").slice(1);
  const banner = promotions.find((p) => p.placement === "banner");

  return (
    <div>
      {banner ? (
        <p className="bg-ink px-4 py-2 text-center text-sm text-white">
          <strong>{banner.title}.</strong> {banner.subtitle}
        </p>
      ) : null}

      {hero ? (
        <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
          <div className="relative overflow-hidden rounded-card bg-brand text-white">
            {hero.image_url ? <Image src={hero.image_url} alt="" fill priority sizes="100vw" className="object-cover object-right" /> : null}
            <div className="absolute inset-0 bg-linear-to-r from-brand via-brand/80 to-transparent" aria-hidden />
            <div className="relative max-w-xl px-6 py-16 sm:px-12 sm:py-24">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{hero.title}</h1>
              {hero.subtitle ? <p className="mt-4 text-lg text-white/80">{hero.subtitle}</p> : null}
              {hero.cta_href ? (
                <ButtonLink href={hero.cta_href} size="lg" variant="secondary" className="mt-8 border-white">
                  {hero.cta_label ?? "Shop now"}
                </ButtonLink>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6" aria-labelledby="categories-heading">
        <h2 id="categories-heading" className="text-2xl font-bold tracking-tight">Shop by category</h2>
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {categories.map((c) => (
            <li key={c.id}>
              <Link href={`/category/${c.slug}`} className="group block overflow-hidden rounded-card border border-line bg-surface text-center text-sm font-medium hover:border-brand hover:text-brand">
                {c.image_url ? (
                  <span className="relative block aspect-[3/2]">
                    <Image src={c.image_url} alt="" fill sizes="(min-width: 1024px) 14vw, (min-width: 640px) 25vw, 50vw" className="object-cover transition-transform group-hover:scale-105" />
                  </span>
                ) : null}
                <span className="block px-3 py-3">{c.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6" aria-labelledby="featured-heading">
        <div className="mb-6 flex items-end justify-between">
          <h2 id="featured-heading" className="text-2xl font-bold tracking-tight">Featured</h2>
          <Link href="/products" className="text-sm font-medium text-brand hover:underline">See all</Link>
        </div>
        <ProductGrid products={featured} />
      </section>

      {secondary.map((promo) => (
        <section key={promo.id} className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
          <div className="flex flex-col items-start gap-4 rounded-card bg-brand-soft px-6 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-12">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-brand-strong">{promo.title}</h2>
              {promo.subtitle ? <p className="mt-2 text-ink-soft">{promo.subtitle}</p> : null}
            </div>
            {promo.cta_href ? <ButtonLink href={promo.cta_href}>{promo.cta_label ?? "Shop now"}</ButtonLink> : null}
          </div>
        </section>
      ))}

      <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6" aria-labelledby="new-heading">
        <div className="mb-6 flex items-end justify-between">
          <h2 id="new-heading" className="text-2xl font-bold tracking-tight">New arrivals</h2>
          <Link href="/products?sort=newest" className="text-sm font-medium text-brand hover:underline">See all</Link>
        </div>
        <ProductGrid products={newArrivals} />
      </section>
    </div>
  );
}
