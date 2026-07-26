/// <reference path="../src/types/ragazzi.d.ts" />

import { readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, stubOpenDialog, stubSaveDialog, test } from "./fixtures/electron";

test("saved histories can be renamed, exported, imported, and replayed", async ({
  electronApp,
  window: page,
}) => {
  const exportPath = path.join(tmpdir(), `ragazzi-history-${Date.now()}.json`);

  try {
    await page.getByRole("link", { name: "mqtt dev tools" }).click();
    await page.evaluate(async () => {
      if (!window.ragazzi?.mqtt) throw new Error("MQTT bridge is unavailable");
      await window.ragazzi.mqtt.subscribe("e2e/history");
      await window.ragazzi.mqtt.publish("e2e/history", btoa("saved payload"));
    });

    await expect(page.getByText("saved payload", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "save history" }).click();

    const savedTab = page.getByRole("tab").filter({ hasText: "History" });
    await expect(savedTab).toBeVisible();
    await savedTab.click();
    const renameInput = page.getByLabel("History tab name");
    await renameInput.fill("Renamed history");
    await renameInput.press("Enter");
    await expect(page.getByRole("tab", { name: /Renamed history/ })).toBeVisible();

    await stubSaveDialog(electronApp, exportPath);
    await page.getByRole("button", { name: "export current history" }).click();
    await expect
      .poll(async () => JSON.parse(await readFile(exportPath, "utf8")))
      .toMatchObject({
        version: 1,
        title: "Renamed history",
        messages: [{ topic: "e2e/history", message: "saved payload", type: "INCOMING" }],
      });

    await stubOpenDialog(electronApp, [exportPath]);
    await page.getByRole("button", { name: "import history" }).click();
    await expect(page.getByRole("tab", { name: /Renamed history/ })).toHaveCount(2);
    await expect(page.getByRole("button", { name: "incoming" })).toBeVisible();
    await expect(page.getByRole("button", { name: "replay" })).toBeEnabled();

    await page.getByRole("button", { name: "replay" }).click();
    await page.getByRole("tab", { name: "live" }).click();
    await expect(page.getByText("saved payload", { exact: true })).toHaveCount(3);

    await page.getByLabel("Close Renamed history").last().click();
    await expect(page.getByRole("tab", { name: /Renamed history/ })).toHaveCount(1);
  } finally {
    await rm(exportPath, { force: true });
  }
});

test("history controls disable empty exports and show invalid import errors", async ({
  electronApp,
  window: page,
}) => {
  const invalidFilePath = path.join(tmpdir(), `ragazzi-invalid-history-${Date.now()}.json`);

  try {
    await writeFile(invalidFilePath, "{not json", "utf8");
    await page.getByRole("link", { name: "mqtt dev tools" }).click();

    await expect(page.getByRole("button", { name: "save history" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "export current history" })).toBeDisabled();

    await stubOpenDialog(electronApp, [invalidFilePath]);
    await page.getByRole("button", { name: "import history" }).click();
    await expect(page.getByText("The selected file is not valid JSON.")).toBeVisible();
  } finally {
    await rm(invalidFilePath, { force: true });
  }
});
