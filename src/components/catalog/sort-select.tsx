"use client";

import { SORTS } from "@/features/catalog/search-params";
import { NativeSelect } from "@/components/ui/native-select";

// Submits the surrounding filter form as soon as the sort changes.
export function SortSelect({ value }: { value: string }) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort" className="text-sm font-semibold text-muted-foreground">
        Sort by
      </label>
      <NativeSelect id="sort" name="sort" defaultValue={value} onChange={(e) => e.currentTarget.form?.requestSubmit()}>
        {Object.entries(SORTS).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </NativeSelect>
    </div>
  );
}
