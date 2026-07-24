import {
  app,
  BrowserWindow,
  dialog,
  Menu,
  ipcMain,
  type MenuItemConstructorOptions,
  type BrowserWindowConstructorOptions,
} from "electron";
import os from "os";
import fs from "fs";
import path from "path";
import http from "http";
import portscanner from "portscanner";
import url from "url";
import mqtt, { type MqttClient } from "mqtt";
import net from "net";
import ws from "websocket-stream";
import { Aedes } from "aedes";
import stats from "aedes-stats";
import { normalizePort } from "../src/lib/ports";
import type { BrokerSettings, ProjectConfig, ProjectView } from "../src/types/ragazzi";

const isDev = !app.isPackaged;
const isE2E = process.env.RAGAZZI_E2E === "1";
const iconPath = [
  path.join(__dirname, "icon.png"),
  path.join(__dirname, "../build/icon.png"),
  path.join(__dirname, "../public/icon.png"),
].find((p) => fs.existsSync(p));

let mainWindow: BrowserWindow | null = null;
let windows: BrowserWindow[] = [];
let mqttClient: MqttClient | null = null;
let brokerRunning = false;
let brokerStarting = false;
let tcpServer: net.Server | null = null;
let wsServer: http.Server | null = null;
let aedes: import("aedes").Aedes | null = null;
let aedesReady: Promise<import("aedes").Aedes> | null = null;
let config: ProjectConfig = {
  title: "",
  description: "",
  views: [],
  externalViews: [],
};
const isMac = process.platform === "darwin";
const interfaces = os.networkInterfaces();
const ipAddresses: string[] = [];
for (const name of Object.keys(interfaces)) {
  for (const address of interfaces[name] ?? []) {
    if (address.family === "IPv4" && !address.internal) {
      ipAddresses.push(address.address);
    }
  }
}
const ip = ipAddresses.length > 0 ? ipAddresses[0] : "127.0.0.1";

let wsPort = Number(process.env.RAGAZZI_WS_PORT) || 9001;
let tcpPort = Number(process.env.RAGAZZI_TCP_PORT) || 1883;
let internalHttpPort = Number(process.env.RAGAZZI_HTTP_PORT) || 8080;
let externalHttpPort = Number(process.env.RAGAZZI_EXTERNAL_HTTP_PORT) || 80;

let internalWebserver: http.Server | null = null;
let externalWebserver: http.Server | null = null;

const ensureAedes = () => {
  if (aedes) {
    return Promise.resolve(aedes);
  }
  if (!aedesReady) {
    aedesReady = Aedes.createBroker().then((broker) => {
      aedes = broker;
      stats(aedes);
      return aedes;
    });
  }
  return aedesReady;
};

const getBrokerSettings = (): BrokerSettings => ({
  running: brokerRunning,
  wsPort,
  tcpPort,
});

const publishBrokerSettings = () => {
  const settings = getBrokerSettings();
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("broker:settings", settings);
  }
  if (mqttClient && brokerRunning) {
    mqttClient.publish(
      "ragazzi",
      JSON.stringify({
        type: "SETBROKERSETTINGS",
        payload: { value: settings },
      })
    );
  }
};

const attachMqttHandlers = () => {
  if (!mqttClient) return;
  mqttClient.on("message", (topic, message) => {
    if (topic === "ragazzi/project/config/get") {
      publishConfig();
    }
    if (topic === "ragazzi/project/open") {
      openProject(message.toString());
    }
    if (topic === "ragazzi/project/open/choose") {
      openProjectChooser();
    }
    if (topic === "ragazzi/project/close") {
      closeProject();
    }
    if (topic === "ragazzi/webapp/open") {
      const file = message.toString();
      const dir = path.dirname(file);
      const fileRelative = path.relative(dir, file);
      openWebsite(dir, fileRelative);
    }
  });
  mqttClient.subscribe("ragazzi/#");
};

const startBroker = async (): Promise<BrokerSettings> => {
  if (brokerRunning || brokerStarting) {
    return getBrokerSettings();
  }
  brokerStarting = true;

  try {
    const broker = await ensureAedes();

    return await new Promise<BrokerSettings>((resolve, reject) => {
      tcpServer = net.createServer(broker.handle);
      wsServer = http.createServer();
      ws.createServer({ server: wsServer }, broker.handle);

      let tcpReady = false;
      let wsReady = false;
      const maybeReady = () => {
        if (!tcpReady || !wsReady) return;
        brokerStarting = false;
        brokerRunning = true;
        publishBrokerSettings();
        resolve(getBrokerSettings());
      };

      wsServer.listen(wsPort, () => {
        console.log("websocket server listening on port ", wsPort);
        wsReady = true;
        maybeReady();
      });
      wsServer.on("error", (err) => {
        brokerStarting = false;
        reject(err);
      });

      tcpServer.listen(tcpPort, () => {
        console.log(`server started and listening on port ${tcpPort}`);
        mqttClient = mqtt.connect(`mqtt://localhost:${tcpPort}`);
        mqttClient.once("connect", () => {
          attachMqttHandlers();
          tcpReady = true;
          maybeReady();
        });
        mqttClient.on("error", (err) => {
          console.error("mqtt client error", err);
        });
      });
      tcpServer.on("error", (err) => {
        brokerStarting = false;
        reject(err);
      });
    });
  } catch (err) {
    brokerStarting = false;
    throw err;
  }
};

const stopBroker = (): Promise<BrokerSettings> =>
  new Promise((resolve) => {
    if (!brokerRunning && !brokerStarting) {
      resolve(getBrokerSettings());
      return;
    }

    const finish = () => {
      tcpServer = null;
      wsServer = null;
      mqttClient = null;
      brokerRunning = false;
      brokerStarting = false;
      publishBrokerSettings();
      resolve(getBrokerSettings());
    };

    const closeServer = (server: http.Server | net.Server | null) =>
      new Promise<void>((res) => {
        if (!server) {
          res();
          return;
        }
        if ("closeAllConnections" in server && typeof server.closeAllConnections === "function") {
          server.closeAllConnections();
        }
        server.close(() => res());
        setTimeout(res, 1000);
      });

    const endMqtt = () =>
      new Promise<void>((res) => {
        if (!mqttClient) {
          res();
          return;
        }
        mqttClient.end(true, {}, () => res());
        setTimeout(res, 1000);
      });

    Promise.all([
      endMqtt(),
      closeServer(tcpServer),
      closeServer(wsServer),
    ]).then(finish);
  });

ipcMain.handle("broker:start", async () => {
  await startBroker();
  return getBrokerSettings();
});
ipcMain.handle("broker:stop", async () => {
  await stopBroker();
  return getBrokerSettings();
});
ipcMain.handle("broker:settings", () => getBrokerSettings());
ipcMain.handle(
  "broker:setPorts",
  async (_event, ports: { wsPort?: number; tcpPort?: number } = {}) => {
    const nextWs = normalizePort(ports.wsPort, wsPort);
    const nextTcp = normalizePort(ports.tcpPort, tcpPort);

    if (nextWs === nextTcp) {
      throw new Error("WebSocket and TCP ports must be different");
    }

    if (nextWs === wsPort && nextTcp === tcpPort) {
      return getBrokerSettings();
    }

    const wasRunning = brokerRunning;
    if (wasRunning) {
      await stopBroker();
    }

    wsPort = nextWs;
    tcpPort = nextTcp;

    if (wasRunning) {
      await startBroker();
    } else {
      publishBrokerSettings();
    }

    return getBrokerSettings();
  }
);

portscanner.findAPortNotInUse(
  externalHttpPort,
  externalHttpPort + 100,
  "127.0.0.1",
  (error, port) => {
    console.log(error);
    console.log("AVAILABLE PORT AT: " + port);
    if (typeof port !== "number") return;
    externalHttpPort = port;
    externalWebserver = http
      .createServer((_req, res) => {
        res.writeHead(200);
        let listItems = "";
        (config.externalViews ?? []).forEach((view) => {
          listItems += `<li><a href="http://${ip}:${internalHttpPort}/${view.path}${parameterAppendix}">${view.title}</a></li>`;
        });
        res.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="X-UA-Compatible" content="ie=edge" />
        <title>Document</title>
      </head>
      <body>
        <h1>ciao ragazzi</h1>
        <p>these external views are available in your project.</p>
        <ul>
        ${listItems}
        </ul>
      </body>
    </html>
    `);
        res.end();
      })
      .listen(externalHttpPort);
  }
);

const parameterAppendix =
  ipAddresses.length > 0 ? `?broker=${ipAddresses[0]}` : "";

const publishConfig = () => {
  if (!mqttClient || !brokerRunning) return;
  const action = {
    type: "SETCONFIG",
    payload: {
      value: {
        ...config,
        ip: ipAddresses[0],
        internalHttpPort,
        externalHttpPort,
      },
    },
  };
  mqttClient.publish("ragazzi", JSON.stringify(action));
};

startBroker().catch((err) => {
  console.error("failed to start broker", err);
});

const createInternalWebserver = (dir: string) => {
  portscanner.findAPortNotInUse(
    internalHttpPort,
    internalHttpPort + 100,
    "127.0.0.1",
    (_error, port) => {
      console.log("AVAILABLE PORT AT: " + port);
      if (typeof port !== "number") return;
      internalHttpPort = port;
      internalWebserver = http
        .createServer((req, res) => {
          const pathname = url.parse(req.url ?? "/", true).pathname ?? "/";
          fs.readFile(path.join(dir, pathname), (err, data) => {
            if (err) {
              res.writeHead(404);
              res.end(JSON.stringify(err));
              return;
            }
            res.writeHead(200);
            res.end(data);
          });
        })
        .listen(internalHttpPort);
    }
  );
};

const openProjectChooser = () => {
  const result = dialog.showOpenDialog({
    filters: [
      {
        name: "ragazzi projects",
        extensions: ["json", "ragazzi", "html", "htm"],
      },
    ],
    properties: ["openFile"],
  });
  result.then((res) => {
    if (!res.canceled) {
      const file = res.filePaths[0];
      const ext = file.split(".").slice(-1)[0];
      const dir = path.dirname(file);
      const fileRelative = path.relative(dir, file);
      if (ext === "html" || ext === "htm") {
        openWebsite(dir, fileRelative);
      } else if (ext === "ragazzi" || ext === "json") {
        openProject(file);
      }
    }
  });
};

const addWindow = (
  targetUrl: string,
  opts?: BrowserWindowConstructorOptions
) => {
  const win = new BrowserWindow({
    ...(iconPath ? { icon: iconPath } : {}),
    ...(opts ?? {}),
  });
  win.loadURL(targetUrl);
  windows.push(win);
};

const openWebsite = (dir: string, fileRelative: string) => {
  closeProjectWindows();
  if (internalWebserver) {
    internalWebserver.close(() => {
      internalWebserver = null;
      createInternalWebserver(dir);
      addWindow(
        `http://localhost:${internalHttpPort}/${fileRelative}${parameterAppendix}`
      );
    });
  } else {
    createInternalWebserver(dir);
    addWindow(
      `http://localhost:${internalHttpPort}/${fileRelative}${parameterAppendix}`
    );
  }
};

const closeProjectWindows = () => {
  windows.forEach((win) => {
    if (!win.isDestroyed()) {
      win.close();
    }
  });
  windows = [];
};

const stopInternalWebserver = () => {
  if (!internalWebserver) return;
  internalWebserver.close();
  internalWebserver = null;
};

const closeProject = () => {
  closeProjectWindows();
  stopInternalWebserver();
  config = {
    title: "",
    description: "",
    views: [],
    externalViews: [],
  };
  publishConfig();
};

const openProject = (file: string) => {
  closeProjectWindows();
  const dir = path.dirname(file);
  if (internalWebserver) {
    internalWebserver.close(() => {
      internalWebserver = null;
      createInternalWebserver(dir);
    });
  } else {
    createInternalWebserver(dir);
  }

  fs.readFile(file, "utf8", (err, data) => {
    if (err) throw err;
    const obj = JSON.parse(data) as ProjectConfig;
    config = {
      ...config,
      ...obj,
    };
    publishConfig();

    (obj.views ?? []).forEach((view: ProjectView) => {
      addWindow(`http://localhost:${internalHttpPort}/${view.path}`, view);
    });
  });
};

function createWindow() {
  const template: MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about" as const },
              { type: "separator" as const },
              { role: "services" as const },
              { type: "separator" as const },
              { role: "hide" as const },
              { role: "hideOthers" as const },
              { role: "unhide" as const },
              { type: "separator" as const },
              { role: "quit" as const },
            ],
          },
        ]
      : []),
    {
      label: "File",
      submenu: [
        {
          label: "open",
          accelerator: "CmdOrCtrl+o",
          click() {
            openProjectChooser();
          },
        },
        isMac ? { role: "close" as const } : { role: "quit" as const },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" as const },
        { role: "redo" as const },
        { type: "separator" as const },
        { role: "cut" as const },
        { role: "copy" as const },
        { role: "paste" as const },
        ...(isMac
          ? [
              { role: "pasteAndMatchStyle" as const },
              { role: "delete" as const },
              { role: "selectAll" as const },
              { type: "separator" as const },
              {
                label: "Speech",
                submenu: [
                  { role: "startSpeaking" as const },
                  { role: "stopSpeaking" as const },
                ],
              },
            ]
          : [
              { role: "delete" as const },
              { type: "separator" as const },
              { role: "selectAll" as const },
            ]),
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" as const },
        { role: "forceReload" as const },
        { role: "toggleDevTools" as const },
        { type: "separator" as const },
        { role: "resetZoom" as const },
        { role: "zoomIn" as const },
        { role: "zoomOut" as const },
        { type: "separator" as const },
        { role: "togglefullscreen" as const },
      ],
    },
    {
      label: "Window",
      submenu: [
        { role: "minimize" as const },
        { role: "zoom" as const },
        ...(isMac
          ? [
              { type: "separator" as const },
              { role: "front" as const },
              { type: "separator" as const },
              { role: "window" as const },
            ]
          : [{ role: "close" as const }]),
      ],
    },
    {
      role: "help",
      submenu: [
        {
          label: "Learn More",
          click: async () => {
            const { shell } = await import("electron");
            await shell.openExternal("https://electronjs.org");
          },
        },
      ],
    },
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    ...(iconPath ? { icon: iconPath } : {}),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.webContents.on("did-finish-load", () => {
    publishBrokerSettings();
  });

  mainWindow.loadURL(
    isDev && !isE2E
      ? "http://localhost:3000"
      : `file://${path.join(__dirname, "../build/index.html")}`
  );
}

app.whenReady().then(() => {
  const dock = app.dock;
  if (isMac && iconPath && dock) {
    dock.setIcon(iconPath);
  }
  createWindow();
});

app.on("window-all-closed", () => {
  app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// silence unused binding (kept for parity with prior JS)
void externalWebserver;
