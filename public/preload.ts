import { contextBridge, ipcRenderer } from "electron";
import type { BrokerSettings } from "../src/types/ragazzi";

contextBridge.exposeInMainWorld("ragazzi", {
  broker: {
    start: (): Promise<BrokerSettings> => ipcRenderer.invoke("broker:start"),
    stop: (): Promise<BrokerSettings> => ipcRenderer.invoke("broker:stop"),
    getSettings: (): Promise<BrokerSettings> => ipcRenderer.invoke("broker:settings"),
    setPorts: (ports: { wsPort?: number; tcpPort?: number }): Promise<BrokerSettings> =>
      ipcRenderer.invoke("broker:setPorts", ports),
    onSettings: (callback: (settings: BrokerSettings) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, settings: BrokerSettings) =>
        callback(settings);
      ipcRenderer.on("broker:settings", handler);
      return () => ipcRenderer.removeListener("broker:settings", handler);
    },
  },
  openExternal: (url: string): Promise<void> => ipcRenderer.invoke("shell:openExternal", url),
});
