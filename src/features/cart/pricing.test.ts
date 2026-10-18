import { amountToFreeShipping, cartSubtotal, isValidQuantity, itemCount, lineTotal, orderTotals, shippingCost, taxAmount } from "./pricing";

const standard = { price: 5, freeOver: 75 };
const express = { price: 15, freeOver: null };

describe("cart pricing", () => {
  it("multiplies price by quantity without float drift", () => {
    expect(lineTotal({ unitPrice: 12.99, quantity: 3 })).toBe(38.97);
  });

  it("adds up the subtotal and item count", () => {
    const lines = [
      { unitPrice: 24.99, quantity: 2 },
      { unitPrice: 0.1, quantity: 3 },
    ];
    expect(cartSubtotal(lines)).toBe(50.28);
    expect(itemCount(lines)).toBe(5);
  });

  it("returns zero for an empty cart", () => {
    expect(cartSubtotal([])).toBe(0);
    expect(itemCount([])).toBe(0);
  });

  it.each([
    [2, 5, true],
    [0, 5, false],
    [6, 5, false],
    [1.5, 5, false],
  ])("isValidQuantity(%p, stock %p) is %p", (qty, stock, expected) => {
    expect(isValidQuantity(qty, stock)).toBe(expected);
  });
});

describe("delivery and tax", () => {
  it("charges standard delivery just under the threshold and frees it at the threshold", () => {
    expect(shippingCost(74.99, standard)).toBe(5);
    expect(shippingCost(75, standard)).toBe(0);
    expect(shippingCost(120, standard)).toBe(0);
  });

  it("always charges express delivery", () => {
    expect(shippingCost(500, express)).toBe(15);
  });

  it("says how much more to spend for free delivery", () => {
    expect(amountToFreeShipping(62.5, standard)).toBe(12.5);
    expect(amountToFreeShipping(80, standard)).toBe(0);
    expect(amountToFreeShipping(10, express)).toBe(0);
  });

  it("rounds tax to cents like the database does", () => {
    expect(taxAmount(189.95, 0.08)).toBe(15.2);
    expect(taxAmount(74.97, 0.08)).toBe(6);
  });

  it("matches the totals create_checkout_order produced in the SQL test", () => {
    expect(orderTotals(74.97, standard, 0.08)).toEqual({ subtotal: 74.97, shipping: 5, tax: 6, total: 85.97 });
    expect(orderTotals(189.95, standard, 0.08)).toEqual({ subtotal: 189.95, shipping: 0, tax: 15.2, total: 205.15 });
  });
});
