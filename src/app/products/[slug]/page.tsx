import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getAllProductSlugs, getProduct, getRelatedProducts } from "@/features/catalog/queries";
import { Gallery } from "@/components/catalog/gallery";
import { PurchasePanel } from "@/components/catalog/purchase-panel";
import { ProductGrid } from "@/components/catalog/product-card";
import { ProductGridSkeleton, Skeleton } from "@/components/ui/skeleton";

export async function generateStaticParams() {
  return (await getAllProductSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const product = await getProduct((await params).slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.short_description ?? undefined,
    openGraph: { images: product.images[0] ? [product.images[0].url] : undefined },
  };
}

async function Related({ category, slug }: { category: string; slug: string }) {
  const related = await getRelatedProducts(category, slug);
  if (related.length === 0) return null;
  return <ProductGrid products={related} />;
}

function ProductSkeleton() {
  return (
    <div className="mx-auto mt-10 grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2" aria-busy="true" aria-label="Loading product">
      <Skeleton className="aspect-square w-full rounded-card" />
      <div className="space-y-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-3/4" />
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}

// Product pages not generated at build time render this fallback, then stream in.
export default function ProductPage({ params }: PageProps<"/products/[slug]">) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductContent params={params} />
    </Suspense>
  );
}

async function ProductContent({ params }: { params: PageProps<"/products/[slug]">["params"] }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  const specs = Object.entries(product.specs);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link href="/products" className="hover:text-ink">Products</Link> <span aria-hidden="true">/</span>{" "}
        <Link href={`/category/${product.category.slug}`} className="hover:text-ink">{product.category.name}</Link>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <Gallery images={product.images} name={product.name} />
        <div>
          {product.brand ? <p className="text-sm font-medium uppercase tracking-wide text-muted">{product.brand}</p> : null}
          <h1 className="mt-1 text-3xl font-bold tracking-tight">{product.name}</h1>
          {product.short_description ? <p className="mt-3 text-lg text-ink-soft">{product.short_description}</p> : null}
          <div className="mt-6">
            <PurchasePanel variants={product.variants} compareAt={product.compare_at_price} />
          </div>
          <ul className="mt-8 space-y-2 border-t border-line pt-6 text-sm text-ink-soft">
            <li>Free standard delivery on orders over $75</li>
            <li>Secure checkout with Stripe</li>
          </ul>
        </div>
      </div>

      <div className="mt-14 grid gap-10 lg:grid-cols-2">
        {product.description ? (
          <section>
            <h2 className="text-xl font-semibold">About this product</h2>
            <p className="mt-3 leading-relaxed text-ink-soft">{product.description}</p>
          </section>
        ) : null}
        {specs.length > 0 ? (
          <section>
            <h2 className="text-xl font-semibold">Specifications</h2>
            <dl className="mt-3 divide-y divide-line rounded-card border border-line bg-surface">
              {specs.map(([key, value]) => (
                <div key={key} className="grid grid-cols-2 gap-4 px-4 py-3 text-sm">
                  <dt className="text-muted">{key}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}
      </div>

      <section className="mt-16" aria-labelledby="related-heading">
        <h2 id="related-heading" className="mb-6 text-xl font-semibold">You may also like</h2>
        <Suspense fallback={<ProductGridSkeleton count={4} />}>
          <Related category={product.category.slug} slug={product.slug} />
        </Suspense>
      </section>
    </div>
  );
}
