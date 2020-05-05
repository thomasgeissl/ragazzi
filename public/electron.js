const { app, BrowserWindow, dialog, Menu, protocol } = require("electron");
const os = require("os");
const fs = require("fs");
const path = require("path");
const http = require("http");
const portscanner = require("portscanner");
const url = require("url");
const mqtt = require("mqtt");
const net = require("net");
const ws = require("websocket-stream");
const isDev = require("electron-is-dev");
const aedes = require("aedes")();
const stats = require("aedes-stats");

const args = process.argv.slice(1);

let mainWindow;
let windows = [];
let mqttClient;
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
const wsPort = 9001;
const tcpPort = 1883;
let internalHttpPort = 8080;
let externalHttpPort = 80;

let internalWebserver;
let externalWebserver;

const tcpServer = net.createServer(aedes.handle);
const wsServer = http.createServer().listen(wsPort, function () {
  console.log("websocket server listening on port ", wsPort);
});
ws.createServer({ server: wsServer }, aedes.handle);

// publish stats via mqtt: $SYS/#
stats(aedes);

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

tcpServer.listen(tcpPort, function () {
  console.log(`server started and listening on port ${tcpPort}`);
  mqttClient = mqtt.connect(`mqtt://localhost:${tcpPort}`);
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
    ...opts,
    webPreferences: {
      webSecurity: false,
    },
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
                submenu: [{ role: "startspeaking" }, { role: "stopspeaking" }],
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
        { role: "forcereload" },
        { role: "toggledevtools" },
        { type: "separator" },
        { role: "resetzoom" },
        { role: "zoomin" },
        { role: "zoomout" },
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
    width: 640,
    height: 768,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadURL(
    isDev
      ? "http://localhost:3000"
      : `file://${path.join(__dirname, "../build/index.html")}`
  );
}

app.whenReady().then(createWindow);
app.whenReady().then(() => {});

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

if (args.length > 0) {
  // dialog.showErrorBox("args", "" + process.argv.length);
  if (args[0].length > 2) {
    openProject(args[0]);
  }
}
