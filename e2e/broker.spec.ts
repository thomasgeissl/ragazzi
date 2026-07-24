/// <reference path="../src/types/ragazzi.d.ts" />

import {
  test,
  expect,
  waitForPort,
  DEFAULT_WS_PORT,
  DEFAULT_TCP_PORT,
} from "./fixtures/electron";
import type { BrokerSettings } from "../src/types/ragazzi";

test("on start the mqtt broker listens on ports 9001 and 1883 @smoke", async ({
  window: page,
}) => {
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

  await expect(
    page.getByText(String(DEFAULT_WS_PORT), { exact: false })
  ).toBeVisible();
  await expect(
    page.getByText(String(DEFAULT_TCP_PORT), { exact: false })
  ).toBeVisible();
});
