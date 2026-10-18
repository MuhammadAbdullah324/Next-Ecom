import Image from "next/image";
import Link from "next/link";
import { Price } from "@/components/ui/price";
import { Badge } from "@/components/ui/badge";
import type { ProductListing } from "@/features/catalog/types";

export function ProductCard({ product, priority = false }: { product: ProductListing; priority?: boolean }) {
  const lowStock = product.in_stock && product.total_stock <= 5;
  const onSale = product.compare_at_price != null && product.compare_at_price > product.min_price;
  return (
    <article className="group relative flex h-full flex-col rounded-3xl bg-card p-2.5 shadow-sm ring-1 ring-border/70 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.image_alt ?? product.name}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 25vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : null}
        <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
          {!product.in_stock ? (
            <Badge className="bg-foreground/85 text-background">Sold out</Badge>
          ) : lowStock ? (
            <Badge variant="warning">Only {product.total_stock} left</Badge>
          ) : null}
          {onSale && product.in_stock ? <Badge>Sale</Badge> : null}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 px-1.5 pb-1.5 pt-3">
        {product.brand ? <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{product.brand}</p> : null}
        <h3 className="font-heading text-[15px] font-medium leading-snug">
          <Link href={`/products/${product.slug}`} className="after:absolute after:inset-0 after:rounded-3xl">
            {product.name}
          </Link>
        </h3>
        <div className="mt-auto pt-1">
          <Price amount={product.min_price} compareAt={product.compare_at_price} from={product.max_price > product.min_price} />
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products }: { products: ProductListing[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
      {products.map((p, i) => (
        <li key={p.id}>
          <ProductCard product={p} priority={i < 4} />
        </li>
      ))}
    </ul>
  );
}
