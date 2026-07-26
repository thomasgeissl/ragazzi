import { contextBridge, ipcRenderer } from "electron";
import type {
  BrokerSettings,
  MqttClientStatus,
  MqttConnectionOptions,
  MqttIncomingMessage,
} from "../src/types/ragazzi";

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
  mqtt: {
    connect: (options: MqttConnectionOptions): Promise<MqttClientStatus> =>
      ipcRenderer.invoke("mqtt:client:connect", options),
    disconnect: (): Promise<MqttClientStatus> => ipcRenderer.invoke("mqtt:client:disconnect"),
    publish: (topic: string, payload: string): Promise<void> =>
      ipcRenderer.invoke("mqtt:client:publish", topic, payload),
    subscribe: (topic: string): Promise<void> => ipcRenderer.invoke("mqtt:client:subscribe", topic),
    unsubscribe: (topic: string): Promise<void> =>
      ipcRenderer.invoke("mqtt:client:unsubscribe", topic),
    onStatus: (callback: (status: MqttClientStatus) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, status: MqttClientStatus) =>
        callback(status);
      ipcRenderer.on("mqtt:client:status", handler);
      return () => ipcRenderer.removeListener("mqtt:client:status", handler);
    },
    onMessage: (callback: (message: MqttIncomingMessage) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, message: MqttIncomingMessage) =>
        callback(message);
      ipcRenderer.on("mqtt:client:message", handler);
      return () => ipcRenderer.removeListener("mqtt:client:message", handler);
    },
  },
  openExternal: (url: string): Promise<void> => ipcRenderer.invoke("shell:openExternal", url),
});
