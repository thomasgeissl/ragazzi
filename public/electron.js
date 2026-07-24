const { app, BrowserWindow, dialog, Menu, ipcMain } = require("electron");
const os = require("os");
const fs = require("fs");
const path = require("path");
const http = require("http");
const portscanner = require("portscanner");
const url = require("url");
const mqtt = require("mqtt");
const net = require("net");
const ws = require("websocket-stream");
const isDev = !app.isPackaged;
const iconPath = [
  path.join(__dirname, "icon.png"),
  path.join(__dirname, "../build/icon.png"),
  path.join(__dirname, "../public/icon.png"),
].find((p) => fs.existsSync(p));
const { Aedes } = require("aedes");
const stats = require("aedes-stats");

const args = process.argv.slice(1);

let mainWindow;
let windows = [];
let mqttClient;
let brokerRunning = false;
let brokerStarting = false;
let tcpServer;
let wsServer;
let aedes;
let aedesReady;
let config = {
  title: "",
  description: "",
  views: [],
  externalViews: [],
};
const isMac = process.platform === "darwin";
const interfaces = os.networkInterfaces();
let ipAddresses = [];
for (var k in interfaces) {
  for (var k2 in interfaces[k]) {
    var address = interfaces[k][k2];
    if (address.family === "IPv4" && !address.internal) {
      ipAddresses.push(address.address);
    }
  }
}
const ip = ipAddresses.length > 0 ? ipAddresses[0] : "127.0.0.1";

// start ws, tcp and web servers
let wsPort = 9001;
let tcpPort = 1883;
let internalHttpPort = 8080;
let externalHttpPort = 80;

let internalWebserver;
let externalWebserver;

const ensureAedes = () => {
  if (aedes) {
    return Promise.resolve(aedes);
  }
  if (!aedesReady) {
    aedesReady = Aedes.createBroker().then((broker) => {
      aedes = broker;
      // publish stats via mqtt: $SYS/#
      stats(aedes);
      return aedes;
    });
  }
  return aedesReady;
};

const getBrokerSettings = () => ({
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
    if (topic === "ragazzi/webapp/open") {
      const file = message.toString();
      const ext = file.split(".").slice(-1)[0];
      const dir = path.dirname(file);
      const fileRelative = path.relative(dir, file);
      openWebsite(dir, fileRelative);
    }
  });
  mqttClient.subscribe("ragazzi/#");
};

const startBroker = async () => {
  if (brokerRunning || brokerStarting) {
    return getBrokerSettings();
  }
  brokerStarting = true;

  try {
    const broker = await ensureAedes();

    return await new Promise((resolve, reject) => {
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

const stopBroker = () =>
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

    const closeServer = (server) =>
      new Promise((res) => {
        if (!server) {
          res();
          return;
        }
        if (typeof server.closeAllConnections === "function") {
          server.closeAllConnections();
        }
        server.close(() => res());
        setTimeout(res, 1000);
      });

    const endMqtt = () =>
      new Promise((res) => {
        if (!mqttClient) {
          res();
          return;
        }
        mqttClient.end(true, {}, () => res());
        setTimeout(res, 1000);
      });

    Promise.all([endMqtt(), closeServer(tcpServer), closeServer(wsServer)]).then(
      finish
    );
  });

const normalizePort = (value, fallback) => {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return fallback;
  }
  return port;
};

ipcMain.handle("broker:start", async () => {
  await startBroker();
  return getBrokerSettings();
});
ipcMain.handle("broker:stop", async () => {
  await stopBroker();
  return getBrokerSettings();
});
ipcMain.handle("broker:settings", () => getBrokerSettings());
ipcMain.handle("broker:setPorts", async (_event, ports = {}) => {
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
});

portscanner.findAPortNotInUse(
  externalHttpPort,
  externalHttpPort + 100,
  "127.0.0.1",
  function (error, port) {
    console.log(error);
    console.log("AVAILABLE PORT AT: " + port);
    externalHttpPort = port;
    externalWebserver = http
      .createServer(function (req, res) {
        res.writeHead(200);
        let listItems = "";
        config.externalViews.map((view) => {
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

const createInternalWebserver = (dir) => {
  portscanner.findAPortNotInUse(
    internalHttpPort,
    internalHttpPort + 100,
    "127.0.0.1",
    function (error, port) {
      console.log("AVAILABLE PORT AT: " + port);
      internalHttpPort = port;
      internalWebserver = http
        .createServer(function (req, res) {
          fs.readFile(
            path.join(dir, url.parse(req.url, true).pathname),
            function (err, data) {
              if (err) {
                res.writeHead(404);
                res.end(JSON.stringify(err));
                return;
              }
              res.writeHead(200);
              res.end(data);
            }
          );
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

const addWindow = (url, opts) => {
  opts = opts ? opts : {};
  let win = new BrowserWindow({
    ...(iconPath ? { icon: iconPath } : {}),
    ...opts,
  });
  win.loadURL(url);
  windows.push(win);
};
const openWebsite = (dir, fileRelative) => {
  windows.forEach((win) => {
    win.close();
  });
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

const openProject = (file) => {
  windows.forEach((win) => {
    win.close();
  });
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
    const obj = JSON.parse(data);
    config = {
      ...config,
      ...obj,
    };
    publishConfig();

    obj.views.forEach((view) => {
      addWindow(`http://localhost:${internalHttpPort}/${view.path}`, view);
    });
  });
};

function createWindow() {
  const template = [
    // { role: 'appMenu' }
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about" },
              { type: "separator" },
              { role: "services" },
              { type: "separator" },
              { role: "hide" },
              { role: "hideothers" },
              { role: "unhide" },
              { type: "separator" },
              { role: "quit" },
            ],
          },
        ]
      : []),
    // { role: 'fileMenu' }
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
        isMac ? { role: "close" } : { role: "quit" },
      ],
    },
    // { role: 'editMenu' }
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        ...(isMac
          ? [
              { role: "pasteAndMatchStyle" },
              { role: "delete" },
              { role: "selectAll" },
              { type: "separator" },
              {
                label: "Speech",
                submenu: [{ role: "startSpeaking" }, { role: "stopSpeaking" }],
              },
            ]
          : [{ role: "delete" }, { type: "separator" }, { role: "selectAll" }]),
      ],
    },
    // { role: 'viewMenu' }
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    // { role: 'windowMenu' }
    {
      label: "Window",
      submenu: [
        { role: "minimize" },
        { role: "zoom" },
        ...(isMac
          ? [
              { type: "separator" },
              { role: "front" },
              { type: "separator" },
              { role: "window" },
            ]
          : [{ role: "close" }]),
      ],
    },
    {
      role: "help",
      submenu: [
        {
          label: "Learn More",
          click: async () => {
            const { shell } = require("electron");
            await shell.openExternal("https://electronjs.org");
          },
        },
      ],
    },
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // Create the browser window.
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

  // and load the index.html of the app.
  mainWindow.loadURL(
    isDev
      ? "http://localhost:3000"
      : `file://${path.join(__dirname, "../build/index.html")}`
  );
}

app.whenReady().then(() => {
  if (isMac && iconPath) {
    app.dock.setIcon(iconPath);
  }
  createWindow();
});

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  //   if (process.platform !== "darwin") {
  //     app.quit();
  //   }
  app.quit();
});

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// if (args.length > 0) {
//   // dialog.showErrorBox("args", "" + process.argv.length);
//   if (args[0].length > 2) {
//     openProject(args[0]);
//   }
// }
