import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getCategories, getCategory } from "@/features/catalog/queries";
import { ListingView } from "@/components/catalog/listing-view";
import { ProductGridSkeleton } from "@/components/ui/skeleton";

export async function generateStaticParams() {
  return (await getCategories()).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/category/[slug]">): Promise<Metadata> {
  const category = await getCategory((await params).slug);
  return category ? { title: category.name, description: category.description ?? undefined } : {};
}

export default function CategoryPage({ params, searchParams }: PageProps<"/category/[slug]">) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6"><ProductGridSkeleton /></div>}>
      <CategoryContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function CategoryContent({ params, searchParams }: Pick<PageProps<"/category/[slug]">, "params" | "searchParams">) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <Link href="/products" className="hover:text-foreground">Products</Link> <span aria-hidden="true">/</span> {category.name}
      </nav>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{category.name}</h1>
      {category.description ? <p className="mt-2 text-foreground/80">{category.description}</p> : null}
      <Suspense fallback={<div className="mt-14"><ProductGridSkeleton /></div>}>
        <ListingView base={`/category/${category.slug}`} category={category.slug} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
