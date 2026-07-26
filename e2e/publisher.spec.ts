import { expect, test } from "./fixtures/electron";

test("publisher automatically sends valid JSON5 input as JSON", async ({ window: page }) => {
  await page.getByRole("link", { name: "mqtt dev tools" }).click();

  await page.getByLabel("topic").fill("e2e/publisher");
  const jsonInput = page.locator("textarea.jer-collection-text-area");
  const publish = page.getByRole("button", { name: "publish" });

  await jsonInput.fill('{unquoted: "value"}');
  await expect(publish).toBeEnabled();

  await publish.click();
  await expect(page.getByText('{"unquoted":"value"}', { exact: true })).toBeVisible();
});

test("publisher blocks invalid JSON and keeps editor actions visible", async ({ window: page }) => {
  await page.getByRole("link", { name: "mqtt dev tools" }).click();

  const jsonInput = page.locator("textarea.jer-collection-text-area");
  const publish = page.getByRole("button", { name: "publish" });

  await expect(jsonInput).toBeVisible();
  await expect(page.locator(".jer-collection-input-button-row .jer-confirm-buttons")).toBeVisible();

  await jsonInput.fill("{invalid:");
  await expect(publish).toBeDisabled();

  await jsonInput.fill('{"valid": true}');
  await expect(publish).toBeEnabled();
});
