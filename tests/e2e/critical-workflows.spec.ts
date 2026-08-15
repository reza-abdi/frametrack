import { expect, test } from "@playwright/test";

async function signIn(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email or username").fill(process.env.E2E_ADMIN_LOGIN!);
  await page.getByLabel("Password").fill(process.env.E2E_ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/$/);
}

test("health and anonymous route protection", async ({ page, request }) => {
  const health = await request.get("/api/health");
  expect(health.status()).toBe(200);
  expect(await health.json()).toMatchObject({ status: "ok" });
  await page.goto("/");
  await expect(page).toHaveURL(/\/login/);
});

test("admin creates a frame, attaches a barcode, sells it, and exports CSV", async ({
  page,
}) => {
  await signIn(page);
  const unique = Date.now().toString();
  const frameResponse = await page.request.post("/api/frames", {
    data: {
      manufacturer: "E2E",
      style: `Smoke-${unique}`,
      color: "Black",
      quantity: 0,
    },
  });
  expect(frameResponse.status()).toBe(201);
  const frame = await frameResponse.json();
  const itemResponse = await page.request.post("/api/items", {
    data: { frameId: frame.id, barcode: `E2E-${unique}`, quantity: 1 },
  });
  expect(itemResponse.status()).toBe(201);
  const item = await itemResponse.json();
  const sale = await page.request.post(`/api/items/${item.id}/sell`, {
    data: { soldPrice: 125 },
  });
  expect(sale.status()).toBe(200);
  expect((await sale.json()).status).toBe("SOLD");
  const csv = await page.request.get("/api/sales/export");
  expect(csv.status()).toBe(200);
  expect(csv.headers()["content-type"]).toContain("text/csv");
});

test("non-admin role rejection", async ({ browser }) => {
  test.skip(
    !process.env.E2E_USER_LOGIN || !process.env.E2E_USER_PASSWORD,
    "Separate non-admin credentials are not configured."
  );
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("/login");
  await page.getByLabel("Email or username").fill(process.env.E2E_USER_LOGIN!);
  await page.getByLabel("Password").fill(process.env.E2E_USER_PASSWORD!);
  await page.getByRole("button", { name: "Sign in" }).click();
  expect((await page.request.get("/api/admin/users")).status()).toBe(403);
  await context.close();
});

test("mocked phone pairing round trip", async ({ page }) => {
  await signIn(page);
  let delivered = false;
  await page.route("**/api/pair", async (route) => {
    await route.fulfill({ json: { code: "ABCDEF", url: "/p/ABCDEF" } });
  });
  await page.route("**/api/pair/ABCDEF", async (route) => {
    await route.fulfill({
      json: delivered ? { barcode: "MOCK-123" } : { barcode: null },
    });
    delivered = true;
  });
  await page.goto("/scan");
  await expect(page.getByText("ABCDEF")).toBeVisible();
});
