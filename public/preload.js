const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("ragazzi", {
  broker: {
    start: () => ipcRenderer.invoke("broker:start"),
    stop: () => ipcRenderer.invoke("broker:stop"),
    getSettings: () => ipcRenderer.invoke("broker:settings"),
    setPorts: (ports) => ipcRenderer.invoke("broker:setPorts", ports),
    onSettings: (callback) => {
      const handler = (_event, settings) => callback(settings);
      ipcRenderer.on("broker:settings", handler);
      return () => ipcRenderer.removeListener("broker:settings", handler);
    },
  },
});
