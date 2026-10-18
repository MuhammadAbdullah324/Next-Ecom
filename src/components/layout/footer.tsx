import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 text-sm text-ink-soft sm:grid-cols-3 sm:px-6">
        <div>
          <p className="font-semibold text-ink">NextEcom</p>
          <p className="mt-2">Chargers, cables, earbuds and cases that keep your phone going.</p>
        </div>
        <div>
          <p className="font-semibold text-ink">Shop</p>
          <ul className="mt-2 space-y-1">
            <li><Link href="/products" className="hover:text-ink">All products</Link></li>
            <li><Link href="/products?sort=newest" className="hover:text-ink">New arrivals</Link></li>
            <li><Link href="/cart" className="hover:text-ink">Cart</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-ink">Help</p>
          <ul className="mt-2 space-y-1">
            <li>Free standard delivery over $75</li>
            <li>Secure payment by Stripe</li>
            <li><Link href="/orders" className="hover:text-ink">Track an order</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
