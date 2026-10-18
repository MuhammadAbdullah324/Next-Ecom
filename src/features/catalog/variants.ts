import type { ProductVariant } from "./types";

// Option names in the order they first appear, e.g. ["Color", "Length"].
export function optionNames(variants: ProductVariant[]) {
  const names: string[] = [];
  for (const v of variants) for (const key of Object.keys(v.options)) if (!names.includes(key)) names.push(key);
  return names;
}

export function optionValues(variants: ProductVariant[], name: string) {
  const values: string[] = [];
  for (const v of variants) {
    const value = v.options[name];
    if (value && !values.includes(value)) values.push(value);
  }
  return values;
}

export function findVariant(variants: ProductVariant[], selected: Record<string, string>) {
  return variants.find((v) => Object.entries(v.options).every(([k, val]) => selected[k] === val));
}

// Picking a value keeps the other choices when that combination exists, otherwise
// jumps to the first variant with the picked value (preferring one in stock).
export function selectOption(variants: ProductVariant[], current: Record<string, string>, name: string, value: string) {
  const exact = findVariant(variants, { ...current, [name]: value });
  if (exact) return exact;
  const withValue = variants.filter((v) => v.options[name] === value);
  return withValue.find((v) => v.stock_quantity > 0) ?? withValue[0];
}

// Whether choosing this value (keeping other choices) leads to something buyable.
export function isValueAvailable(variants: ProductVariant[], current: Record<string, string>, name: string, value: string) {
  const v = findVariant(variants, { ...current, [name]: value });
  return !!v && v.stock_quantity > 0;
}

export function defaultVariant(variants: ProductVariant[]) {
  return variants.find((v) => v.is_default && v.stock_quantity > 0) ?? variants.find((v) => v.stock_quantity > 0) ?? variants[0];
}
