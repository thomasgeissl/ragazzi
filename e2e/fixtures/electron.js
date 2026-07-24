const { test as base, expect, _electron as electron } = require("@playwright/test");
const path = require("path");
const net = require("net");
const electronPath = require("electron");

const ROOT = path.join(__dirname, "..");

/** Default broker ports ragazzi binds on startup. */
const DEFAULT_WS_PORT = 9001;
const DEFAULT_TCP_PORT = 1883;

function waitForPort(port, { host = "127.0.0.1", timeoutMs = 20_000 } = {}) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const tryConnect = () => {
      const socket = net.connect({ port, host }, () => {
        socket.end();
        resolve();
      });
      socket.on("error", () => {
        socket.destroy();
        if (Date.now() - started > timeoutMs) {
          reject(new Error(`Port ${port} did not open within ${timeoutMs}ms`));
          return;
        }
        setTimeout(tryConnect, 200);
      });
    };
    tryConnect();
  });
}

/**
 * Stub Electron's native open dialog so tests stay headless/deterministic.
 * @param {import('@playwright/test').ElectronApplication} electronApp
 * @param {string[]} filePaths
 */
async function stubOpenDialog(electronApp, filePaths) {
  await electronApp.evaluate(({ dialog }, paths) => {
    dialog.showOpenDialog = async () => ({
      canceled: false,
      filePaths: paths,
    });
  }, filePaths);
}

const test = base.extend({
  electronApp: async ({}, use) => {
    const env = { ...process.env };
    // Cursor/IDE may set this; it breaks launching the Electron binary.
    delete env.ELECTRON_RUN_AS_NODE;
    // Use default broker ports (do not override).
    delete env.RAGAZZI_WS_PORT;
    delete env.RAGAZZI_TCP_PORT;

    const app = await electron.launch({
      executablePath: electronPath,
      args: [ROOT, "--no-sandbox"],
      env,
      timeout: 60_000,
    });

    await use(app);
    await app.close().catch(() => {});
  },

  /** Main renderer window (not project view windows). */
  window: async ({ electronApp }, use) => {
    const window = await electronApp.firstWindow();
    await window.waitForLoadState("domcontentloaded");
    await expect(window.getByText("ciao ragazzi.")).toBeVisible();
    await use(window);
  },
});

module.exports = {
  test,
  expect,
  stubOpenDialog,
  waitForPort,
  ROOT,
  DEFAULT_WS_PORT,
  DEFAULT_TCP_PORT,
};
