import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ExternalLink, Trash2 } from "lucide-react";
import { z } from "zod";
import { requireAdmin } from "@/features/admin/guard";
import { getAdminProduct, listAdminCategories } from "@/features/admin/queries";
import { deleteProduct, setProductActive } from "@/features/admin/catalog-actions";
import { getStoreSettings } from "@/features/checkout/queries";
import { AdminPageHeader, Panel, AdminSkeleton } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";
import { VariantEditor } from "@/components/admin/variant-editor";
import { ImageManager } from "@/components/admin/image-manager";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";

export const metadata: Metadata = { title: "Edit product" };

async function EditProductPageContent({ params, searchParams }: PageProps<"/admin/products/[id]">) {
  const { id } = await params;
  await requireAdmin(`/admin/products/${id}`);
  if (!z.uuid().safeParse(id).success) notFound();
  const [product, categories, settings, sp] = await Promise.all([getAdminProduct(id), listAdminCategories(), getStoreSettings(), searchParams]);
  if (!product) notFound();
  const stock = product.variants.filter((v) => v.is_active).reduce((n, v) => n + v.stock_quantity, 0);

  return (
    <>
      <AdminPageHeader
        title={product.name}
        back={{ href: "/admin/products", label: "Products" }}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            {product.is_active ? <Badge variant="success">Visible</Badge> : <Badge variant="neutral">Hidden</Badge>}
            <span>{stock} in stock across {product.variants.length} {product.variants.length === 1 ? "variant" : "variants"}</span>
          </span>
        }
        actions={
          <>
            {product.is_active ? (
              <ButtonLink href={`/products/${product.slug}`} variant="outline" size="sm" target="_blank">
                <ExternalLink aria-hidden /> View in store
              </ButtonLink>
            ) : null}
            <form action={setProductActive}>
              <input type="hidden" name="id" value={product.id} />
              <input type="hidden" name="active" value={String(!product.is_active)} />
              <SubmitButton variant="outline" size="sm" pendingLabel="Saving…">{product.is_active ? "Hide from store" : "Show in store"}</SubmitButton>
            </form>
          </>
        }
      />
      {sp.created ? <Alert variant="success" className="mb-4">Product created. Add more photos and sizes below.</Alert> : null}

      <div className="grid gap-6">
        <Panel title="Details">
          <ProductForm product={product} categories={categories} />
        </Panel>
        <Panel title="Sizes, variants and stock" description="Each variant has its own SKU and stock. Shoppers pick from the options you set.">
          <VariantEditor productId={product.id} basePrice={product.price} currency={settings.currency} variants={product.variants} />
        </Panel>
        <Panel title="Photos" description="The first photo is the cover shown in listings.">
          <ImageManager productId={product.id} productName={product.name} images={product.images} />
        </Panel>
        <Panel title="Delete product">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-xl text-sm text-muted-foreground">
              Deleting removes it from the store and from shoppers&apos; carts. Past orders keep their copy of the name and price. To take it down for a while, hide it instead.
            </p>
            <form action={deleteProduct}>
              <input type="hidden" name="id" value={product.id} />
              <ConfirmButton variant="destructive" size="sm" pendingLabel="Deleting…" message={`Delete ${product.name}? This can't be undone.`}>
                <Trash2 aria-hidden /> Delete product
              </ConfirmButton>
            </form>
          </div>
        </Panel>
      </div>
    </>
  );
}

// The Suspense boundary sits inside the page so switching between admin pages shows the
// skeleton at once while live data streams in (an instant navigation).
export default function EditProductPage(props: PageProps<"/admin/products/[id]">) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <EditProductPageContent {...props} />
    </Suspense>
  );
}
