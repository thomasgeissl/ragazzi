import path from "path";
import { expect, ROOT, stubOpenDialog, test } from "./fixtures/electron";

const PROJECT = path.join(ROOT, "example/multiple/index.ragazzi");

test("broker can be turned off and on @smoke", async ({ window }) => {
  const toggle = window.getByRole("switch");
  await expect(toggle).toBeChecked();

  await toggle.click();
  await expect(window.getByText("off", { exact: true })).toBeVisible();
  await expect(toggle).not.toBeChecked();
  await expect(window.getByText("The mqtt broker is stopped", { exact: false })).toBeVisible();

  await toggle.click();
  await expect(window.getByText("on", { exact: true })).toBeVisible();
  await expect(toggle).toBeChecked();
});

test("open project then shutdown @smoke", async ({ electronApp, window }) => {
  await stubOpenDialog(electronApp, [PROJECT]);

  await window.getByRole("button", { name: "open project" }).click();
  await expect(window.getByText("project is hosted")).toBeVisible();
  await expect(window.getByText("primary")).toBeVisible();
  await expect(window.getByText("secondary")).toBeVisible();
  await expect(window.getByRole("link", { name: "external", exact: true })).toBeVisible();

  await window.getByRole("button", { name: "shutdown" }).click();
  await expect(window.getByRole("button", { name: "open project" })).toBeVisible();
  await expect(window.getByText("project is hosted")).toHaveCount(0);
});
