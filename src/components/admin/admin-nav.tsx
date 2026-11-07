"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderTree, Images, LayoutDashboard, Package, Settings, Shirt, Store, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Orders", icon: Package },
  { href: "/admin/products", label: "Products", icon: Shirt },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/content", label: "Banners & content", icon: Images },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible lg:px-3 lg:pb-0 [scrollbar-width:none]">
      {LINKS.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-10 shrink-0 items-center gap-2.5 whitespace-nowrap rounded-md px-3 text-sm font-medium text-foreground/75 transition-colors hover:bg-muted hover:text-foreground",
              active && "bg-muted text-foreground",
            )}
          >
            <Icon aria-hidden className="size-4" />
            {label}
          </Link>
        );
      })}
      <Link
        href="/"
        className="flex min-h-10 shrink-0 items-center gap-2.5 whitespace-nowrap rounded-md px-3 text-sm font-medium text-foreground/75 hover:bg-muted hover:text-foreground lg:mt-4 lg:border-t lg:pt-4"
      >
        <Store aria-hidden className="size-4" />
        View store
      </Link>
    </nav>
  );
}
