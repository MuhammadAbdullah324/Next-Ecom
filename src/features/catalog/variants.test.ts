import type { ProductVariant } from "./types";
import { defaultVariant, findVariant, isValueAvailable, optionNames, optionValues, selectOption } from "./variants";

const v = (id: string, color: string, length: string, stock: number, isDefault = false): ProductVariant => ({
  id, sku: id, name: `${color} / ${length}`, options: { Color: color, Length: length }, price: 10, stock_quantity: stock, is_default: isDefault,
});

const cable = [v("b1", "Black", "1 m", 5, true), v("b2", "Black", "2 m", 3), v("r1", "Red", "1 m", 2), v("r2", "Red", "2 m", 0)];

describe("variant selection", () => {
  it("lists option names and values in catalog order", () => {
    expect(optionNames(cable)).toEqual(["Color", "Length"]);
    expect(optionValues(cable, "Length")).toEqual(["1 m", "2 m"]);
  });

  it("keeps the other choice when the combination exists", () => {
    expect(selectOption(cable, cable[1].options, "Color", "Red")?.id).toBe("r2");
    expect(findVariant(cable, { Color: "Red", Length: "1 m" })?.id).toBe("r1");
  });

  it("marks values that lead to a sold-out combination", () => {
    expect(isValueAvailable(cable, { Color: "Black", Length: "2 m" }, "Color", "Red")).toBe(false);
    expect(isValueAvailable(cable, { Color: "Black", Length: "1 m" }, "Color", "Red")).toBe(true);
  });

  it("starts on the default variant, or the first in stock", () => {
    expect(defaultVariant(cable).id).toBe("b1");
    expect(defaultVariant([v("x", "Red", "2 m", 0, true), v("y", "Red", "1 m", 4)]).id).toBe("y");
  });
});
