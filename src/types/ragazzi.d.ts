export interface BrokerSettings {
  running: boolean;
  wsPort: number;
  tcpPort: number;
}

export interface ProjectView {
  path: string;
  title: string;
  [key: string]: unknown;
}

export interface ProjectConfig {
  title?: string;
  description?: string;
  views?: ProjectView[];
  externalViews?: ProjectView[];
  ip?: string;
  internalHttpPort?: number;
  externalHttpPort?: number;
  [key: string]: unknown;
}

export interface RagazziBrokerApi {
  start: () => Promise<BrokerSettings>;
  stop: () => Promise<BrokerSettings>;
  getSettings: () => Promise<BrokerSettings>;
  setPorts: (ports: { wsPort?: number; tcpPort?: number }) => Promise<BrokerSettings>;
  onSettings: (callback: (settings: BrokerSettings) => void) => () => void;
}

export type MqttProtocol = "mqtt" | "mqtts" | "ws" | "wss";

export interface MqttConnectionOptions {
  protocol: MqttProtocol;
  host: string;
  port: number;
  username?: string;
  password?: string;
}

export interface MqttClientStatus {
  connected: boolean;
  protocol: MqttProtocol;
  host: string;
  port: number;
  error?: string;
}

export interface MqttIncomingMessage {
  topic: string;
  payload: string;
}

export interface RagazziMqttApi {
  connect: (options: MqttConnectionOptions) => Promise<MqttClientStatus>;
  disconnect: () => Promise<MqttClientStatus>;
  publish: (topic: string, payload: string) => Promise<void>;
  subscribe: (topic: string) => Promise<void>;
  unsubscribe: (topic: string) => Promise<void>;
  onStatus: (callback: (status: MqttClientStatus) => void) => () => void;
  onMessage: (callback: (message: MqttIncomingMessage) => void) => () => void;
}

export interface RagazziApi {
  broker: RagazziBrokerApi;
  mqtt: RagazziMqttApi;
  openExternal: (url: string) => Promise<void>;
}

declare global {
  interface Window {
    ragazzi?: RagazziApi;
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof import("redux").compose;
  }
}
