import { expect, test, type Page } from "@playwright/test";

const address = {
  full_name: "Test Shopper",
  phone: "+92 300 1234567",
  address_line_1: "12 Mall Road",
  city: "Lahore",
  postal_code: "54000",
};

// Option buttons for unavailable combinations are announced as "Red (out of stock)".
const optionName = (option: string) => new RegExp(`^${option}( \\(out of stock\\))?$`);

async function addToCart(page: Page, slug: string, options: string[] = [], quantity = 1) {
  await page.goto(`/products/${slug}`);
  for (const option of options) await page.getByRole("button", { name: optionName(option) }).click();
  for (let i = 1; i < quantity; i++) await page.getByRole("button", { name: "Increase quantity" }).click();
  await page.getByRole("button", { name: "Add to cart" }).click();
  await expect(page.getByText("Added to cart")).toBeVisible();
}

async function fillNewAddress(page: Page) {
  for (const [name, value] of Object.entries(address)) await page.locator(`input[name="${name}"]`).fill(value);
}

async function goToPayment(page: Page) {
  await page.getByRole("button", { name: "Continue to payment" }).click();
  await expect(page.getByRole("heading", { name: /^Pay / })).toBeVisible();
}

test("browse: filter, sort and paginate the catalog @mobile", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Featured" })).toBeVisible();

  await page.goto("/products");
  await expect(page.getByText("21 products")).toBeVisible();
  await expect(page.getByRole("link", { name: "Page 2" })).toBeVisible();

  await page.goto("/category/sleepwear?sort=price-asc");
  const names = await page.locator("article h3").allTextContents();
  expect(names).toEqual(["Dinosaur Pajama Set", "Starry Night Pajama Set", "Cozy Fleece Sleep Sack"]);

  await page.goto("/products?q=fleece&inStock=1");
  await expect(page.getByText(/products? for “fleece”/)).toBeVisible();
  await expect(page.locator("article h3")).not.toContainText(["Fleece-Lined Winter Parka"]);

  await page.goto("/products?brand=Nope");
  await expect(page.getByText("No products match")).toBeVisible();
});

test("product page: options change price and stock", async ({ page }) => {
  await page.goto("/products/striped-cotton-tee");
  await expect(page.getByText("$12.99").first()).toBeVisible();
  await page.getByRole("button", { name: optionName("4-5Y") }).click();
  await expect(page.getByText("$14.99").first()).toBeVisible();
  await page.getByRole("button", { name: optionName("Red") }).click();
  await expect(page.getByText("Out of stock").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Out of stock", exact: true })).toBeDisabled();
});

test("guest checkout: successful payment shows confirmation and empties the cart", async ({ page }) => {
  await addToCart(page, "striped-cotton-tee", ["Red", "2-3Y"], 2);
  await page.goto("/cart");
  await expect(page.getByText("Red / 2-3Y")).toBeVisible();
  await page.getByRole("link", { name: "Go to checkout" }).click();

  await page.getByLabel("Email").fill("guest@example.com");
  await fillNewAddress(page);
  await expect(page.getByText("$25.98").first()).toBeVisible(); // 2 × 12.99
  await goToPayment(page);
  await page.getByRole("link", { name: "Pay now" }).click();

  await expect(page.getByRole("heading", { name: "Thank you, your order is confirmed" })).toBeVisible();
  await expect(page.getByText(/Order NE-\d{6}-\d{5}/)).toBeVisible();
  await expect(page.getByText("guest@example.com").first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Create an account to track this order" })).toBeVisible();

  await page.goto("/cart");
  await expect(page.getByText("Your cart is empty")).toBeVisible();
});

test("guest checkout: canceling on the payment page keeps the cart", async ({ page }) => {
  await addToCart(page, "cotton-sun-hat");
  await page.goto("/checkout");
  await page.getByLabel("Email").fill("guest@example.com");
  await fillNewAddress(page);
  await goToPayment(page);
  await page.getByRole("link", { name: "Back to store" }).click();

  await expect(page.getByText("Payment canceled")).toBeVisible();
  await expect(page.getByText("You have not been charged.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Cotton Sun Hat" })).toBeVisible();
});

test("guest checkout: failed payment explains what happened", async ({ page }) => {
  await addToCart(page, "cotton-sun-hat");
  await page.goto("/checkout");
  await page.getByLabel("Email").fill("guest@example.com");
  await fillNewAddress(page);
  await goToPayment(page);
  await page.getByRole("link", { name: "Fail payment" }).click();

  await expect(page.getByRole("heading", { name: "Your payment didn't go through" })).toBeVisible();
  await page.getByRole("link", { name: "Return to cart" }).click();
  await expect(page.getByRole("link", { name: "Cotton Sun Hat" })).toBeVisible();
});

test("checkout validation shows field errors", async ({ page }) => {
  await addToCart(page, "cotton-sun-hat");
  await page.goto("/checkout");
  await page.getByRole("button", { name: "Continue to payment" }).click();
  await expect(page.getByText("Enter the recipient's name.")).toBeVisible();
  await expect(page.getByText("Enter a valid email address.").first()).toBeVisible();
});

test("account: sign up, keep guest cart, save address, see order history", async ({ page }) => {
  const email = `shopper+${Date.now()}@example.com`;
  await addToCart(page, "organic-cotton-bodysuit-3-pack");

  await page.goto("/sign-up?next=/cart");
  await page.getByLabel("Full name").fill("Test Shopper");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("correct-horse-42");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/cart$/);
  await expect(page.getByRole("link", { name: "Organic Cotton Bodysuit 3-Pack" })).toBeVisible();

  await page.getByRole("link", { name: "Go to checkout" }).click();
  await expect(page.getByText(`Confirmation goes to ${email}`)).toBeVisible();
  await fillNewAddress(page);
  await goToPayment(page);
  await page.getByRole("link", { name: "Pay now" }).click();
  await expect(page.getByRole("heading", { name: "Thank you, your order is confirmed" })).toBeVisible();

  await page.goto("/orders");
  await expect(page.getByText("Confirmed")).toBeVisible();

  await addToCart(page, "organic-cotton-bodysuit-3-pack");
  await page.goto("/checkout");
  await expect(page.getByText("Test Shopper").first()).toBeVisible(); // saved address offered
  await expect(page.locator('input[name="savedAddressId"]')).toBeChecked();

  // Sign out, then sign back in as a guest with a new cart item: the carts merge.
  await page.goto("/");
  await page.getByRole("button", { name: "Account" }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await addToCart(page, "rainbow-socks-5-pack");
  await page.goto("/sign-in?next=/cart");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("correct-horse-42");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/cart$/);
  await expect(page.getByRole("link", { name: "Rainbow Socks 5-Pack" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Organic Cotton Bodysuit 3-Pack" })).toBeVisible();
});

test("protected pages send guests to sign in", async ({ page }) => {
  await page.goto("/orders");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Forders/);
  await page.getByLabel("Email").fill("nobody@example.com");
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByText("Email or password is incorrect.")).toBeVisible();
});
