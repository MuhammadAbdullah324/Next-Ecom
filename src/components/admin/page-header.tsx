import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminPageHeader({ title, description, back, actions }: { title: string; description?: ReactNode; back?: { href: string; label: string }; actions?: ReactNode }) {
  return (
    <div className="mb-6 space-y-2">
      {back ? (
        <Link href={back.href} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft aria-hidden className="size-4" />
          {back.label}
        </Link>
      ) : null}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
          {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

export function Panel({ title, description, children, actions, className = "" }: { title?: string; description?: ReactNode; children: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border bg-card ${className}`}>
      {title ? (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4">
          <div>
            <h2 className="font-semibold">{title}</h2>
            {description ? <p className="mt-0.5 text-sm text-muted-foreground">{description}</p> : null}
          </div>
          {actions}
        </div>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed bg-card px-6 py-14 text-center">
      <p className="font-semibold">{title}</p>
      {children ? <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{children}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function AdminSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading" className="space-y-4">
      <Skeleton className="h-9 w-56" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-28" />)}
      </div>
      <Skeleton className="h-80" />
    </div>
  );
}

