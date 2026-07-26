import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { PayloadEncoding } from "../lib/payload";

export type MessageType = "INCOMING" | "OUTGOING";

export interface MqttMessage {
  topic: string;
  message: string;
  encoding: PayloadEncoding;
  timestamp: Date;
  type: MessageType;
}

export interface MqttState {
  connected: boolean;
  receivedMessages: MqttMessage[];
  sentMessages: MqttMessage[];
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
  reset: () => void;
}

export const initialMqttState = {
  connected: false,
  receivedMessages: [],
  sentMessages: [],
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
) => [{ topic, message, encoding, timestamp: new Date(), type }, ...messages].slice(0, 99);

export const useMqttStore = create<MqttState>()(
  devtools(
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
            subscriptions: new Map([...state.subscriptions.keys()].map((topic) => [topic, false])),
          }),
          false,
          "MqttStore/unsubscribeAll",
        ),
      clearMessages: () =>
        set({ receivedMessages: [], sentMessages: [] }, false, "MqttStore/clearMessages"),
      reset: () =>
        set(
          {
            ...initialMqttState,
            receivedMessages: [],
            sentMessages: [],
            subscriptions: new Map(),
          },
          false,
          "MqttStore/reset",
        ),
    }),
    { name: "MqttStore" },
  ),
);
