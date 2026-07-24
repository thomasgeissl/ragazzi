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

declare global {
  interface Window {
    ragazzi?: {
      broker: RagazziBrokerApi;
    };
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof import("redux").compose;
  }
}
