import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="text-sm font-semibold text-sale">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">We couldn&apos;t find that page</h1>
      <p className="mt-3 text-foreground/80">The product may have been removed, or the link may be wrong.</p>
      <ButtonLink href="/products" className="mt-8">Browse products</ButtonLink>
    </div>
  );
}
