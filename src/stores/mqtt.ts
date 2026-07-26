import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import type { ImportedHistory } from "../lib/history";
import type { PayloadEncoding } from "../lib/payload";

export type MessageType = "INCOMING" | "OUTGOING";

export interface MqttMessage {
  id: string;
  topic: string;
  message: string;
  encoding: PayloadEncoding;
  timestamp: Date;
  type: MessageType;
}

export interface HistoryTab {
  id: string;
  title: string;
  createdAt: Date;
  messages: MqttMessage[];
}

export interface MqttState {
  connected: boolean;
  receivedMessages: MqttMessage[];
  sentMessages: MqttMessage[];
  historyTabs: HistoryTab[];
  protocol: string;
  host: string;
  port: number;
  connectionEnabled: boolean;
  subscriptions: Map<string, boolean>;
  setBroker: (protocol: string, host: string, port: number) => void;
  setConnected: (connected: boolean) => void;
  setConnectionEnabled: (connectionEnabled: boolean) => void;
  addReceivedMessage: (topic: string, message: string, encoding?: PayloadEncoding) => void;
  addSentMessage: (topic: string, message: string, encoding?: PayloadEncoding) => void;
  addSubscription: (topic: string) => void;
  subscribe: (topic: string) => void;
  unsubscribe: (topic: string) => void;
  unsubscribeAll: () => void;
  clearMessages: () => void;
  saveHistoryTab: () => string | undefined;
  importHistoryTab: (history: ImportedHistory) => string;
  renameHistoryTab: (id: string, title: string) => void;
  deleteHistoryTab: (id: string) => void;
  reset: () => void;
}

type PersistedMqttState = Pick<
  MqttState,
  "protocol" | "host" | "port" | "connectionEnabled" | "subscriptions" | "historyTabs"
>;

export const initialMqttState = {
  connected: false,
  receivedMessages: [],
  sentMessages: [],
  historyTabs: [],
  protocol: "ws",
  host: "localhost",
  port: 9001,
  connectionEnabled: true,
  subscriptions: new Map<string, boolean>(),
} satisfies Pick<
  MqttState,
  | "connected"
  | "receivedMessages"
  | "sentMessages"
  | "historyTabs"
  | "protocol"
  | "host"
  | "port"
  | "connectionEnabled"
  | "subscriptions"
>;

const appendMessage = (
  messages: MqttMessage[],
  topic: string,
  message: string,
  encoding: PayloadEncoding,
  type: MessageType,
) =>
  [
    { id: crypto.randomUUID(), topic, message, encoding, timestamp: new Date(), type },
    ...messages,
  ].slice(0, 99);

function isSerializedMap(value: unknown): value is { type: "Map"; entries: [string, boolean][] } {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    value.type === "Map" &&
    "entries" in value &&
    Array.isArray(value.entries)
  );
}

function isDateField(key: string, value: unknown): value is string {
  return (
    (key === "timestamp" || key === "createdAt") &&
    typeof value === "string" &&
    !Number.isNaN(Date.parse(value))
  );
}

const unavailableStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

const mqttStorage = createJSONStorage<PersistedMqttState>(
  () => (typeof window === "undefined" ? unavailableStorage : localStorage),
  {
    replacer: (_key, value) =>
      value instanceof Map ? { type: "Map", entries: [...value.entries()] } : value,
    reviver: (_key, value) =>
      isSerializedMap(value)
        ? new Map<string, boolean>(value.entries)
        : isDateField(_key, value)
          ? new Date(value)
          : value,
  },
);

export const useMqttStore = create<MqttState>()(
  devtools(
    persist(
      (set) => ({
        ...initialMqttState,
        setBroker: (protocol, host, port) =>
          set({ protocol: protocol.trim(), host: host.trim(), port }, false, "MqttStore/setBroker"),
        setConnected: (connected) => set({ connected }, false, "MqttStore/setConnected"),
        setConnectionEnabled: (connectionEnabled) =>
          set({ connectionEnabled }, false, "MqttStore/setConnectionEnabled"),
        addReceivedMessage: (topic, message, encoding = "utf8") =>
          set(
            (state) => ({
              receivedMessages: appendMessage(
                state.receivedMessages,
                topic,
                message,
                encoding,
                "INCOMING",
              ),
            }),
            false,
            "MqttStore/addReceivedMessage",
          ),
        addSentMessage: (topic, message, encoding = "utf8") =>
          set(
            (state) => ({
              sentMessages: appendMessage(state.sentMessages, topic, message, encoding, "OUTGOING"),
            }),
            false,
            "MqttStore/addSentMessage",
          ),
        addSubscription: (topic) =>
          set(
            (state) => ({ subscriptions: new Map(state.subscriptions).set(topic, true) }),
            false,
            "MqttStore/addSubscription",
          ),
        subscribe: (topic) =>
          set(
            (state) => ({ subscriptions: new Map(state.subscriptions).set(topic, true) }),
            false,
            "MqttStore/subscribe",
          ),
        unsubscribe: (topic) =>
          set(
            (state) => ({ subscriptions: new Map(state.subscriptions).set(topic, false) }),
            false,
            "MqttStore/unsubscribe",
          ),
        unsubscribeAll: () =>
          set(
            (state) => ({
              subscriptions: new Map(
                [...state.subscriptions.keys()].map((topic) => [topic, false]),
              ),
            }),
            false,
            "MqttStore/unsubscribeAll",
          ),
        clearMessages: () =>
          set({ receivedMessages: [], sentMessages: [] }, false, "MqttStore/clearMessages"),
        saveHistoryTab: () => {
          const id = crypto.randomUUID();
          const createdAt = new Date();
          let saved = false;
          set(
            (state) => {
              const messages = [...state.receivedMessages, ...state.sentMessages].sort(
                (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
              );
              if (messages.length === 0) return state;

              saved = true;
              return {
                historyTabs: [
                  ...state.historyTabs,
                  {
                    id,
                    title: `History ${createdAt.toLocaleString()}`,
                    createdAt,
                    messages,
                  },
                ],
              };
            },
            false,
            "MqttStore/saveHistoryTab",
          );
          return saved ? id : undefined;
        },
        importHistoryTab: (history) => {
          const id = crypto.randomUUID();
          const createdAt = new Date();
          set(
            (state) => ({
              historyTabs: [
                ...state.historyTabs,
                {
                  id,
                  title: history.title,
                  createdAt,
                  messages: [...history.messages].sort(
                    (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
                  ),
                },
              ],
            }),
            false,
            "MqttStore/importHistoryTab",
          );
          return id;
        },
        renameHistoryTab: (id, title) =>
          set(
            (state) => ({
              historyTabs: state.historyTabs.map((historyTab) =>
                historyTab.id === id
                  ? { ...historyTab, title: title.trim() || historyTab.title }
                  : historyTab,
              ),
            }),
            false,
            "MqttStore/renameHistoryTab",
          ),
        deleteHistoryTab: (id) =>
          set(
            (state) => ({
              historyTabs: state.historyTabs.filter((historyTab) => historyTab.id !== id),
            }),
            false,
            "MqttStore/deleteHistoryTab",
          ),
        reset: () =>
          set(
            {
              ...initialMqttState,
              receivedMessages: [],
              sentMessages: [],
              historyTabs: [],
              subscriptions: new Map(),
            },
            false,
            "MqttStore/reset",
          ),
      }),
      {
        name: "ragazzi-mqtt",
        storage: mqttStorage,
        partialize: (state) => ({
          protocol: state.protocol,
          host: state.host,
          port: state.port,
          connectionEnabled: state.connectionEnabled,
          subscriptions: state.subscriptions,
          historyTabs: state.historyTabs,
        }),
      },
    ),
    { name: "MqttStore" },
  ),
);
