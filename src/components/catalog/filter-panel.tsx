import type { ListingFilters } from "@/features/catalog/search-params";
import { Input } from "@/components/ui/input";

// Plain GET form fields, so filtering works before JavaScript loads and the URL is shareable.
export function FilterFields({ filters, brands }: { filters: ListingFilters; brands: string[] }) {
  return (
    <div className="space-y-6">
      {brands.length > 0 ? (
        <fieldset>
          <legend className="font-heading text-sm font-semibold">Brand</legend>
          <div className="mt-3 space-y-2">
            {brands.map((brand) => (
              <label key={brand} className="flex min-h-8 items-center gap-2 text-sm">
                <input type="checkbox" name="brand" value={brand} defaultChecked={filters.brand.includes(brand)} className="size-4 rounded accent-primary" />
                {brand}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}
      <fieldset>
        <legend className="font-heading text-sm font-semibold">Price</legend>
        <div className="mt-3 flex items-center gap-2">
          <label className="sr-only" htmlFor="min">Minimum price</label>
          <Input id="min" name="min" type="number" inputMode="decimal" min={0} placeholder="Min" defaultValue={filters.min ?? ""} />
          <span aria-hidden="true" className="text-muted-foreground">–</span>
          <label className="sr-only" htmlFor="max">Maximum price</label>
          <Input id="max" name="max" type="number" inputMode="decimal" min={0} placeholder="Max" defaultValue={filters.max ?? ""} />
        </div>
      </fieldset>
      <label className="flex min-h-8 items-center gap-2 text-sm">
        <input type="checkbox" name="inStock" value="1" defaultChecked={filters.inStock} className="size-4 rounded accent-primary" />
        In stock only
      </label>
    </div>
  );
}
