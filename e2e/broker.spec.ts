/// <reference path="../src/types/ragazzi.d.ts" />

import type { BrokerSettings } from "../src/types/ragazzi";
import { DEFAULT_TCP_PORT, DEFAULT_WS_PORT, expect, test, waitForPort } from "./fixtures/electron";

test("on start the mqtt broker listens on ports 9001 and 1883 @smoke", async ({ window: page }) => {
  await expect(page.getByRole("switch")).toBeChecked();
  await expect(page.getByText("on", { exact: true })).toBeVisible();

  await waitForPort(DEFAULT_WS_PORT);
  await waitForPort(DEFAULT_TCP_PORT);

  const broker = await page.evaluate(async (): Promise<BrokerSettings> => {
    if (!window.ragazzi?.broker) {
      throw new Error("window.ragazzi.broker is unavailable");
    }
    return window.ragazzi.broker.getSettings();
  });

  expect(broker).toMatchObject({
    running: true,
    wsPort: DEFAULT_WS_PORT,
    tcpPort: DEFAULT_TCP_PORT,
  });

  await expect(page.getByText(String(DEFAULT_WS_PORT), { exact: false })).toBeVisible();
  await expect(page.getByText(String(DEFAULT_TCP_PORT), { exact: false })).toBeVisible();
});

test("Dev Tools disconnect switch reveals editable broker settings", async ({ window: page }) => {
  await page.getByRole("link", { name: "mqtt dev tools" }).click();

  const brokerSwitch = page.getByLabel("Broker connection");
  await expect(brokerSwitch).toBeChecked();
  await expect(page.getByLabel("protocol")).not.toBeVisible();

  await brokerSwitch.click();

  await expect(brokerSwitch).not.toBeChecked();
  await expect(page.getByLabel("protocol")).toBeVisible();
  await expect(page.getByLabel("host")).toBeVisible();
  await expect(page.getByLabel("port")).toBeVisible();
  await expect(page.getByLabel("username")).toBeVisible();
  await expect(page.getByLabel("password")).toBeVisible();
  await expect(page.getByLabel("protocol")).toBeEditable();
  await expect(page.getByLabel("host")).toBeEditable();
  await expect(page.getByLabel("port")).toBeEditable();
  await page.getByLabel("username").fill("public");
  await page.getByLabel("password").fill("public");

  await brokerSwitch.click();

  await expect(brokerSwitch).toBeChecked();
});
