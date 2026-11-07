import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ButtonLink } from "@/components/ui/button";

// For addresses that match no route (and admin pages for non-admins). Pages inside the store use
// (store)/not-found.tsx, which already sits inside the store header and footer.
export default function NotFound() {
  return (
    <>
      <Header />
      <main id="main" className="flex-1">
        <div className="mx-auto max-w-xl px-4 py-24 text-center">
          <p className="text-sm font-semibold text-sale">404</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">We couldn&apos;t find that page</h1>
          <p className="mt-3 text-foreground/80">The product may have been removed, or the link may be wrong.</p>
          <ButtonLink href="/products" className="mt-8">Browse products</ButtonLink>
        </div>
      </main>
      <Footer />
    </>
  );
}
