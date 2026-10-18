"use client";

import { SORTS } from "@/features/catalog/search-params";

// Submits the surrounding filter form as soon as the sort changes.
export function SortSelect({ value }: { value: string }) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort" className="text-sm text-muted">
        Sort by
      </label>
      <select
        id="sort"
        name="sort"
        defaultValue={value}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="min-h-10 rounded-full border border-line bg-surface px-3 text-sm"
      >
        {Object.entries(SORTS).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}
