import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAdmin } from "@/features/admin/guard";
import { AdminNav } from "@/components/admin/admin-nav";
import { Logo } from "@/components/layout/logo";
import { AdminSkeleton } from "@/components/admin/page-header";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Tiny Threads admin" },
  robots: { index: false, follow: false },
};

async function AdminGate({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return children;
}

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="min-h-dvh flex-1 bg-muted/40 lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="sticky top-0 z-20 border-b bg-background lg:h-dvh lg:border-b-0 lg:border-r">
        <div className="flex h-14 items-center gap-2 px-4 lg:h-16 lg:px-6">
          <Logo />
          <span className="rounded-sm bg-foreground px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-background">Admin</span>
        </div>
        <Suspense fallback={<div className="h-12" />}>
          <AdminNav />
        </Suspense>
      </aside>
      <main id="main" className="min-w-0 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <div className="mx-auto max-w-6xl">
          <Suspense fallback={<AdminSkeleton />}>
            <AdminGate>{children}</AdminGate>
          </Suspense>
        </div>
      </main>
    </div>
  );
}
