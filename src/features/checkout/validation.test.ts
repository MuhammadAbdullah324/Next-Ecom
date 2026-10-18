import { fieldErrors, parseCheckoutForm } from "./validation";

const form = (entries: Record<string, string>) => {
  const fd = new FormData();
  Object.entries(entries).forEach(([k, v]) => fd.set(k, v));
  return fd;
};

const address = { full_name: "Ali", phone: "+92 300 1234567", address_line_1: "1 Mall Rd", city: "Lahore", postal_code: "54000", country: "Pakistan" };

describe("parseCheckoutForm", () => {
  it("accepts a complete new address", () => {
    const r = parseCheckoutForm(form({ addressMode: "new", shippingMethod: "standard", email: "A@Example.com", saveAddress: "on", ...address }));
    expect(r.success).toBe(true);
    if (r.success && r.data.addressMode === "new") {
      expect(r.data.email).toBe("a@example.com");
      expect(r.data.saveAddress).toBe(true);
      expect(r.data.address.address_line_2).toBeUndefined();
    }
  });

  it("names the missing fields", () => {
    const r = parseCheckoutForm(form({ addressMode: "new", shippingMethod: "standard", ...address, city: " ", phone: "abc" }));
    expect(r.success).toBe(false);
    if (!r.success) expect(fieldErrors(r.error)).toMatchObject({ city: "Enter the city.", phone: "Enter a valid phone number." });
  });

  it("requires a valid saved address id", () => {
    const r = parseCheckoutForm(form({ addressMode: "saved", savedAddressId: "nope", shippingMethod: "standard" }));
    expect(r.success).toBe(false);
  });
});
