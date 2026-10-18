// Pure pricing rules used for display. They mirror create_checkout_order() in the database,
// which is what actually decides the amount charged.

export type PricedLine = { unitPrice: number; quantity: number };
export type ShippingMethod = {
  code: string;
  name: string;
  description: string | null;
  price: number;
  freeOver: number | null;
  minDays: number;
  maxDays: number;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export function lineTotal(line: PricedLine) {
  return round2(line.unitPrice * line.quantity);
}

export function cartSubtotal(lines: PricedLine[]) {
  return round2(lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0));
}

export function itemCount(lines: { quantity: number }[]) {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

export function isValidQuantity(quantity: number, stock: number) {
  return Number.isInteger(quantity) && quantity > 0 && quantity <= stock;
}

export function shippingCost(subtotal: number, method: Pick<ShippingMethod, "price" | "freeOver">) {
  return method.freeOver != null && subtotal >= method.freeOver ? 0 : method.price;
}

// How much more to spend for free delivery, or 0 when already free.
export function amountToFreeShipping(subtotal: number, method: Pick<ShippingMethod, "freeOver">) {
  if (method.freeOver == null) return 0;
  return Math.max(0, round2(method.freeOver - subtotal));
}

export function taxAmount(subtotal: number, taxRate: number) {
  return round2(subtotal * taxRate);
}

export function orderTotals(subtotal: number, method: Pick<ShippingMethod, "price" | "freeOver">, taxRate: number) {
  const shipping = shippingCost(subtotal, method);
  const tax = taxAmount(subtotal, taxRate);
  return { subtotal, shipping, tax, total: round2(subtotal + shipping + tax) };
}
