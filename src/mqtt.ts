import mqtt, { type MqttClient } from "mqtt";
import store from "./store";
import { addReceivedMessage, setBroker } from "./store/reducers/mqtt";

let client: MqttClient = mqtt.connect("ws://localhost:9001");
let secondClient: MqttClient | null = null;
let localWsPort = 9001;

const attachMessageHandler = (mqttClient: MqttClient) => {
  mqttClient.on("message", (topic, message) => {
    store.dispatch(addReceivedMessage(topic, message.toString()));
  });
};

attachMessageHandler(client);

export const getClient = (): MqttClient => {
  return secondClient ? secondClient : client;
};

export const connect = (protocol: string, host: string, port: string | number): MqttClient => {
  if (secondClient) {
    secondClient.end();
  }
  secondClient = mqtt.connect(`${protocol}://${host}:${port}`);
  attachMessageHandler(secondClient);
  console.log("connected to", host, port);
  return secondClient;
};

export const reconnectLocal = (wsPort: number | string): MqttClient => {
  const port = Number(wsPort) || 9001;
  if (port === localWsPort && client && !secondClient) {
    return client;
  }
  localWsPort = port;
  try {
    client.end(true);
  } catch {
    // ignore disconnect errors while reconnecting
  }
  client = mqtt.connect(`ws://localhost:${port}`);
  attachMessageHandler(client);
  if (!secondClient) {
    store.dispatch(setBroker("ws", "localhost", port));
  }
  return client;
};

export default client;
