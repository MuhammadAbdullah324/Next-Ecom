import Image from "next/image";
import Link from "next/link";
import { Price } from "@/components/ui/price";
import type { ProductListing } from "@/features/catalog/types";

export function ProductCard({ product, priority = false }: { product: ProductListing; priority?: boolean }) {
  const lowStock = product.in_stock && product.total_stock <= 5;
  return (
    <article className="group relative flex flex-col">
      <div className="relative aspect-square overflow-hidden rounded-card border border-line bg-surface">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.image_alt ?? product.name}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 25vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : null}
        {!product.in_stock ? (
          <span className="absolute left-3 top-3 rounded-full bg-ink/80 px-2.5 py-1 text-xs font-semibold text-white">Sold out</span>
        ) : lowStock ? (
          <span className="absolute left-3 top-3 rounded-full bg-warning-soft px-2.5 py-1 text-xs font-semibold text-warning">Only {product.total_stock} left</span>
        ) : null}
      </div>
      <div className="mt-3 flex flex-1 flex-col gap-1">
        {product.brand ? <p className="text-xs font-medium uppercase tracking-wide text-muted">{product.brand}</p> : null}
        <h3 className="text-sm font-medium leading-snug">
          <Link href={`/products/${product.slug}`} className="after:absolute after:inset-0">
            {product.name}
          </Link>
        </h3>
        <Price amount={product.min_price} compareAt={product.compare_at_price} from={product.max_price > product.min_price} />
      </div>
    </article>
  );
}

export function ProductGrid({ products }: { products: ProductListing[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
      {products.map((p, i) => (
        <li key={p.id}>
          <ProductCard product={p} priority={i < 4} />
        </li>
      ))}
    </ul>
  );
}
