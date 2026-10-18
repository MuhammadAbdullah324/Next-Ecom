import { z } from "zod";

const text = (label: string, max = 120) => z.string().trim().min(1, `Enter ${label}.`).max(max);
const optional = (max = 120) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => v || undefined);

export const addressSchema = z.object({
  full_name: text("the recipient's name"),
  phone: z.string().trim().regex(/^[+()\d\s-]{6,20}$/, "Enter a valid phone number."),
  address_line_1: text("the street address", 200),
  address_line_2: optional(200),
  city: text("the city"),
  state: optional(),
  postal_code: text("the postal code", 20),
  country: text("the country", 60),
});

export type AddressInput = z.infer<typeof addressSchema>;

const email = z.email("Enter a valid email address.").trim().toLowerCase();
const shippingMethod = z.string().min(1, "Choose a delivery method.");

export const checkoutSchema = z.discriminatedUnion("addressMode", [
  z.object({
    addressMode: z.literal("saved"),
    savedAddressId: z.uuid("Choose a delivery address."),
    email: email.optional(),
    shippingMethod,
  }),
  z.object({
    addressMode: z.literal("new"),
    address: addressSchema,
    saveAddress: z.boolean(),
    email: email.optional(),
    shippingMethod,
  }),
]);

export type CheckoutInput = z.infer<typeof checkoutSchema>;

// Field name -> first error message, for showing errors next to inputs.
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[issue.path.length - 1] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

export function parseCheckoutForm(formData: FormData) {
  const get = (key: string) => {
    const v = formData.get(key);
    return typeof v === "string" ? v : undefined;
  };
  const shared = { email: get("email") || undefined, shippingMethod: get("shippingMethod") ?? "" };

  if (get("addressMode") === "saved") {
    return checkoutSchema.safeParse({ addressMode: "saved", savedAddressId: get("savedAddressId"), ...shared });
  }
  return checkoutSchema.safeParse({
    addressMode: "new",
    saveAddress: get("saveAddress") === "on",
    address: {
      full_name: get("full_name") ?? "",
      phone: get("phone") ?? "",
      address_line_1: get("address_line_1") ?? "",
      address_line_2: get("address_line_2"),
      city: get("city") ?? "",
      state: get("state"),
      postal_code: get("postal_code") ?? "",
      country: get("country") ?? "",
    },
    ...shared,
  });
}
