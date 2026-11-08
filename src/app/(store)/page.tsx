import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getCategories, getFeaturedProducts, getNewArrivals } from "@/features/catalog/queries";
import { PageAnnouncement, PageFeatures, PageHero } from "@/components/content/page-promotions";
import { ProductGrid } from "@/components/catalog/product-card";

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
  const [categories, featured, newArrivals] = await Promise.all([getCategories(), getFeaturedProducts(8), getNewArrivals(4)]);

  return (
    <div>
      {/* Banners, heroes and feature cards are managed in /admin/content. */}
      <PageAnnouncement page="home" />
      <PageHero page="home" size="full" heading="h1" />

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

      <PageFeatures page="home" className="mx-auto max-w-7xl px-4 pt-20 sm:px-6" />

      <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6" aria-labelledby="new-heading">
        <SectionHeading id="new-heading" title="New arrivals" href="/products?sort=newest" linkLabel="See all" />
        <ProductGrid products={newArrivals} />
      </section>
    </div>
  );
}
