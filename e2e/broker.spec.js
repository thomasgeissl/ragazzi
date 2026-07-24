const {
  test,
  expect,
  waitForPort,
  DEFAULT_WS_PORT,
  DEFAULT_TCP_PORT,
} = require("./fixtures/electron");

test("on start the mqtt broker listens on ports 9001 and 1883 @smoke", async ({
  window,
}) => {
  await expect(window.getByRole("switch")).toBeChecked();
  await expect(window.getByText("on", { exact: true })).toBeVisible();

  await waitForPort(DEFAULT_WS_PORT);
  await waitForPort(DEFAULT_TCP_PORT);

  const broker = await window.evaluate(async () => {
    return window.ragazzi.broker.getSettings();
  });

  expect(broker).toMatchObject({
    running: true,
    wsPort: DEFAULT_WS_PORT,
    tcpPort: DEFAULT_TCP_PORT,
  });

  await expect(
    window.getByText(String(DEFAULT_WS_PORT), { exact: false })
  ).toBeVisible();
  await expect(
    window.getByText(String(DEFAULT_TCP_PORT), { exact: false })
  ).toBeVisible();
});
