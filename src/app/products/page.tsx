import type { Metadata } from "next";
import { Suspense } from "react";
import { ListingView } from "@/components/catalog/listing-view";
import { ProductGridSkeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "All products" };

export default function ProductsPage({ searchParams }: PageProps<"/products">) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">All products</h1>
      <Suspense fallback={<div className="mt-14"><ProductGridSkeleton /></div>}>
        <ListingView base="/products" searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
