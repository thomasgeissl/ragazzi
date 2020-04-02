const { app, BrowserWindow, dialog, Menu, protocol } = require("electron");
const path = require("path");
const isDev = require("electron-is-dev");

const aedes = require("aedes")();
const httpServer = require("http").createServer();
const port = 9001;

const tcpServer = require("net").createServer(aedes.handle);
const tcpPort = 1883;

const isMac = process.platform === "darwin";

tcpServer.listen(tcpPort, function() {
  console.log("server started and listening on port ", tcpPort);
});

const ws = require("websocket-stream");
ws.createServer({ server: httpServer }, aedes.handle);

httpServer.listen(port, function() {
  console.log("websocket server listening on port ", port);
});

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
            const result = dialog.showOpenDialog({
              properties: ["openFile"]
            });
            result.then(res => {
              if (!res.canceled) {
                let win = new BrowserWindow({
                  webPreferences: {
                    webSecurity: false
                  }
                });
                win.loadURL("file://" + res.filePaths[0]);
                // win.loadURL(
                //   "file:///Users/thomas.geissl/projects/grantlerrecords/website/public/index.html"
                // );
                // win.loadURL("https://sz.de");
              }
            });
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
  let win = new BrowserWindow({
    width: 640,
    height: 480,
    webPreferences: {
      nodeIntegration: true
    }
  });

  // and load the index.html of the app.
  win.loadURL(
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
