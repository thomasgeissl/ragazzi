import { Buffer } from "node:buffer";
import { decodePayload, encodePayload, type PayloadEncoding } from "./lib/payload";
import { useMqttStore } from "./stores/mqtt";

type Payload = string | Uint8Array;

const mqttApi = () => {
  if (!window.ragazzi?.mqtt) {
    throw new Error("The Electron MQTT bridge is unavailable");
  }
  return window.ragazzi.mqtt;
};

const dispatchConnectionError = () => {
  useMqttStore.getState().setConnected(false);
};

const runMqttOperation = (operation: () => Promise<unknown>) => {
  void operation().catch(dispatchConnectionError);
};

const client = {
  get connected() {
    return useMqttStore.getState().connected;
  },
  publish(topic: string, payload: Payload) {
    const encodedPayload = Buffer.from(payload).toString("base64");
    runMqttOperation(() => mqttApi().publish(topic, encodedPayload));
  },
  subscribe(topic: string) {
    runMqttOperation(() => mqttApi().subscribe(topic));
  },
  unsubscribe(topic: string) {
    runMqttOperation(() => mqttApi().unsubscribe(topic));
  },
};

export const getClient = () => client;

export function publishMessage(topic: string, message: string, encoding: PayloadEncoding): void {
  const payload = encodePayload(message, encoding);
  useMqttStore.getState().addSentMessage(topic, payload.message, payload.encoding);
  client.publish(topic, payload.payload);
}

export const connect = (
  protocol: string,
  host: string,
  port: string | number,
  username?: string,
  password?: string,
): void => {
  const connection = {
    protocol: protocol as import("./types/ragazzi").MqttProtocol,
    host,
    port: Number(port),
    username,
    password,
  };
  // A client connection never carries subscriptions to its next session.
  // Keep the saved topic list but mark every topic inactive before reconnecting.
  const mqttStore = useMqttStore.getState();
  mqttStore.unsubscribeAll();
  mqttStore.setBroker(protocol, host, Number(port));
  mqttStore.setConnectionEnabled(true);
  runMqttOperation(() => mqttApi().connect(connection));
};

export const disconnect = (): void => {
  const mqttStore = useMqttStore.getState();
  mqttStore.unsubscribeAll();
  mqttStore.setConnected(false);
  mqttStore.setConnectionEnabled(false);
  runMqttOperation(() => mqttApi().disconnect());
};

export const reconnectLocal = (wsPort: number | string) => {
  const state = useMqttStore.getState();
  const port = Number(wsPort) || 9001;
  if (
    !state.connectionEnabled ||
    state.protocol !== "ws" ||
    state.host !== "localhost" ||
    state.port === port
  ) {
    return client;
  }
  connect("ws", "localhost", port);
  return client;
};

if (window.ragazzi?.mqtt) {
  window.ragazzi.mqtt.onStatus((status) => {
    const mqttStore = useMqttStore.getState();
    mqttStore.setBroker(status.protocol, status.host, status.port);
    mqttStore.setConnected(status.connected);
  });
  window.ragazzi.mqtt.onMessage((message) => {
    const decoded = decodePayload(Buffer.from(message.payload, "base64"));
    useMqttStore.getState().addReceivedMessage(message.topic, decoded.message, decoded.encoding);
  });
  connect("ws", "localhost", 9001);
}

export default client;
