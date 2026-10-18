import { safeNext } from "./redirects";

describe("safeNext", () => {
  it.each([
    ["/checkout", "/checkout"],
    ["/orders?x=1", "/orders?x=1"],
    ["https://evil.example", "/"],
    ["//evil.example", "/"],
    ["/\\evil.example", "/"],
    [undefined, "/"],
  ])("%p -> %p", (input, expected) => {
    expect(safeNext(input)).toBe(expected);
  });
});
