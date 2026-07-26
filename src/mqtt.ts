import { Buffer } from "node:buffer";
import { decodePayload } from "./lib/payload";
import store from "./store";
import {
  addReceivedMessage,
  setBroker,
  setConnected,
  setConnectionEnabled,
  unsubscribeAll,
} from "./store/reducers/mqtt";

type Payload = string | Uint8Array;

const mqttApi = () => {
  if (!window.ragazzi?.mqtt) {
    throw new Error("The Electron MQTT bridge is unavailable");
  }
  return window.ragazzi.mqtt;
};

const dispatchConnectionError = () => {
  store.dispatch(setConnected(false));
};

const runMqttOperation = (operation: () => Promise<unknown>) => {
  void operation().catch(dispatchConnectionError);
};

const client = {
  get connected() {
    return store.getState().mqtt.connected;
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
  store.dispatch(unsubscribeAll());
  store.dispatch(setBroker(protocol, host, Number(port)));
  store.dispatch(setConnectionEnabled(true));
  runMqttOperation(() => mqttApi().connect(connection));
};

export const disconnect = (): void => {
  store.dispatch(unsubscribeAll());
  store.dispatch(setConnected(false));
  store.dispatch(setConnectionEnabled(false));
  runMqttOperation(() => mqttApi().disconnect());
};

export const reconnectLocal = (wsPort: number | string) => {
  const state = store.getState().mqtt;
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
    store.dispatch(setBroker(status.protocol, status.host, status.port));
    store.dispatch(setConnected(status.connected));
  });
  window.ragazzi.mqtt.onMessage((message) => {
    const decoded = decodePayload(Buffer.from(message.payload, "base64"));
    store.dispatch(addReceivedMessage(message.topic, decoded.message, decoded.encoding));
  });
  connect("ws", "localhost", 9001);
}

export default client;
