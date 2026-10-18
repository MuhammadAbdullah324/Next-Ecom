import Image from "next/image";
import Link from "next/link";
import { Price } from "@/components/ui/price";
import { Badge } from "@/components/ui/badge";
import type { ProductListing } from "@/features/catalog/types";

export function ProductCard({ product, priority = false }: { product: ProductListing; priority?: boolean }) {
  const lowStock = product.in_stock && product.total_stock <= 5;
  const onSale = product.compare_at_price != null && product.compare_at_price > product.min_price;
  return (
    <article className="group relative flex h-full flex-col">
      <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-muted">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.image_alt ?? product.name}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 25vw, 50vw"
            className={`object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] ${product.in_stock ? "" : "opacity-60"}`}
          />
        ) : null}
        <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
          {!product.in_stock ? (
            <Badge className="bg-card text-foreground">Sold out</Badge>
          ) : onSale ? (
            <Badge variant="sale">Sale</Badge>
          ) : null}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-0.5 pt-3">
        {product.brand ? <p className="text-xs text-muted-foreground">{product.brand}</p> : null}
        <h3 className="text-sm font-medium leading-snug">
          <Link href={`/products/${product.slug}`} className="after:absolute after:inset-0 after:rounded-lg">
            {product.name}
          </Link>
        </h3>
        <div className="mt-1">
          <Price amount={product.min_price} compareAt={product.compare_at_price} from={product.max_price > product.min_price} />
        </div>
        {lowStock ? <p className="mt-0.5 text-xs font-medium text-warning">Only {product.total_stock} left</p> : null}
      </div>
    </article>
  );
}

export function ProductGrid({ products }: { products: ProductListing[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
      {products.map((p, i) => (
        <li key={p.id}>
          <ProductCard product={p} priority={i < 4} />
        </li>
      ))}
    </ul>
  );
}
