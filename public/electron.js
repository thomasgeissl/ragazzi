const { app, BrowserWindow, dialog, Menu, protocol } = require("electron");
const os = require("os");
const fs = require("fs");
const path = require("path");
const http = require("http");
const url = require("url");
const mqtt = require("mqtt");
const net = require("net");
const ws = require("websocket-stream");
const isDev = require("electron-is-dev");
const aedes = require("aedes")();
const stats = require("aedes-stats");

const args = process.argv.slice(1);

let mainWindow;
let mqttClient;
let config = {
  title: "",
  description: "",
  views: [],
  externalViews: []
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
const internalHttpPort = 8080;
const externalHttpPort = 80;

const tcpServer = net.createServer(aedes.handle);
const wsServer = http.createServer();
const httpServer = http
  .createServer(function(req, res) {
    res.writeHead(200);
    let listItems = "";
    config.externalViews.map(view => {
      listItems += `<li><a href="http://${ip}:${internalHttpPort}/${view.path}">${view.title}</a></li>`;
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

ws.createServer({ server: wsServer }, aedes.handle);

wsServer.listen(wsPort, function() {
  console.log("websocket server listening on port ", wsPort);
});

let internalWebserver;

// publish stats via mqtt: $SYS/#
stats(aedes);

const parameterAppendix =
  ipAddresses.length > 0 ? `?broker=${ipAddresses[0]}` : "";

const publishConfig = () => {
  const action = {
    type: "SETCONFIG",
    payload: {
      value: { ...config, ip: ipAddresses[0], httpPort: internalHttpPort }
    }
  };
  mqttClient.publish("ragazzi", JSON.stringify(action));
};

tcpServer.listen(tcpPort, function() {
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
  });
  mqttClient.subscribe("ragazzi/#");
});

const openProjectChooser = () => {
  if (config.views.length) {
    return;
  }
  const result = dialog.showOpenDialog({
    filters: [
      {
        name: "ragazzi projects",
        extensions: ["json", "ragazzi", "html", "htm"]
      }
    ],
    properties: ["openFile"]
  });
  result.then(res => {
    if (!res.canceled) {
      const file = res.filePaths[0];
      const ext = file.split(".").slice(-1)[0];
      const dir = path.dirname(file);
      const fileRelative = path.relative(dir, file);
      if (ext === "html" || ext === "htm") {
        console.log("open website");
        openWebsite(dir, fileRelative);
      } else if (ext === "ragazzi" || ext === "json") {
        console.log("open project");
        openProject(file);
      }
    }
  });
};
const openWebsite = (dir, fileRelative) => {
  if (config.views.length) {
    return;
  }
  internalWebserver = http
    .createServer(function(req, res) {
      fs.readFile(path.join(dir, url.parse(req.url, true).pathname), function(
        err,
        data
      ) {
        if (err) {
          res.writeHead(404);
          res.end(JSON.stringify(err));
          return;
        }
        res.writeHead(200);
        res.end(data);
      });
    })
    .listen(8080);
  let win = new BrowserWindow({
    webPreferences: {
      webSecurity: false
    }
  });
  win.loadURL(
    `http://localhost:${internalHttpPort}/${fileRelative}${parameterAppendix}`
  );
};
const openProject = file => {
  if (config.views.length) {
    return;
  }
  const dir = path.dirname(file);
  internalWebserver = http
    .createServer(function(req, res) {
      const pathName = url.parse(req.url, true).pathname;
      fs.readFile(path.join(dir, pathName), function(err, data) {
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
  fs.readFile(file, "utf8", (err, data) => {
    if (err) throw err;
    const obj = JSON.parse(data);
    config = {
      ...config,
      ...obj
    };
    publishConfig();

    obj.views.forEach(view => {
      let win = new BrowserWindow({
        ...view,
        webPreferences: {
          webSecurity: false
        }
      });
      win.loadURL(`http://localhost:${internalHttpPort}/${view.path}`);
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
              { role: "quit" }
            ]
          }
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
          }
        },
        isMac ? { role: "close" } : { role: "quit" }
      ]
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
                submenu: [{ role: "startspeaking" }, { role: "stopspeaking" }]
              }
            ]
          : [{ role: "delete" }, { type: "separator" }, { role: "selectAll" }])
      ]
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
        { role: "togglefullscreen" }
      ]
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
              { role: "window" }
            ]
          : [{ role: "close" }])
      ]
    },
    {
      role: "help",
      submenu: [
        {
          label: "Learn More",
          click: async () => {
            const { shell } = require("electron");
            await shell.openExternal("https://electronjs.org");
          }
        }
      ]
    }
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 640,
    height: 640,
    webPreferences: {
      nodeIntegration: true
    }
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
  // dialog.showErrorBox("args", args[0]);
  if (args[0].length > 2) {
    openProject(args[0]);
  }
}
