import {
  test as base,
  type ElectronApplication,
  _electron as electron,
  expect,
  type Page,
} from "@playwright/test";
import electronPath from "electron";
import net from "net";

/** Project root — npm scripts run Playwright with cwd at the repo root. */
const ROOT = process.cwd();

/** Default broker ports ragazzi binds on startup. */
export const DEFAULT_WS_PORT = 9001;
export const DEFAULT_TCP_PORT = 1883;

export function waitForPort(
  port: number,
  { host = "127.0.0.1", timeoutMs = 20_000 }: { host?: string; timeoutMs?: number } = {},
): Promise<void> {
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
 */
export async function stubOpenDialog(
  electronApp: ElectronApplication,
  filePaths: string[],
): Promise<void> {
  await electronApp.evaluate(({ dialog }, paths) => {
    dialog.showOpenDialog = async () => ({
      canceled: false,
      filePaths: paths,
    });
  }, filePaths);
}

type ElectronFixtures = {
  electronApp: ElectronApplication;
  window: Page;
};

export const test = base.extend<ElectronFixtures>({
  electronApp: async (_fixtures, use) => {
    const env = { ...process.env };
    // Cursor/IDE may set this; it breaks launching the Electron binary.
    delete env.ELECTRON_RUN_AS_NODE;
    // Use default broker ports (do not override).
    delete env.RAGAZZI_WS_PORT;
    delete env.RAGAZZI_TCP_PORT;

    const app = await electron.launch({
      executablePath: String(electronPath),
      args: [ROOT, "--no-sandbox"],
      env: Object.fromEntries(
        Object.entries(env).filter((entry): entry is [string, string] => entry[1] !== undefined),
      ),
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

export { expect, ROOT };
