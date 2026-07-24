import mqtt from "mqtt";
import store from "./store";
import { addReceivedMessage, setBroker } from "./store/reducers/mqtt";

let client = mqtt.connect("ws://localhost:9001");
let secondClient = null;
let localWsPort = 9001;

const attachMessageHandler = (mqttClient) => {
  mqttClient.on("message", function (topic, message) {
    store.dispatch(addReceivedMessage(topic, message.toString()));
  });
};

attachMessageHandler(client);

const getClient = () => {
  return secondClient ? secondClient : client;
};

const connect = (protocol, host, port) => {
  if (secondClient) {
    secondClient.end();
  }
  secondClient = mqtt.connect(`${protocol}://${host}:${port}`);
  attachMessageHandler(secondClient);
  console.log("connected to", host, port);
  return secondClient;
};

const reconnectLocal = (wsPort) => {
  const port = Number(wsPort) || 9001;
  if (port === localWsPort && client && !secondClient) {
    return client;
  }
  localWsPort = port;
  try {
    client.end(true);
  } catch (err) {
    // ignore disconnect errors while reconnecting
  }
  client = mqtt.connect(`ws://localhost:${port}`);
  attachMessageHandler(client);
  if (!secondClient) {
    store.dispatch(setBroker("ws", "localhost", port));
  }
  return client;
};

export { getClient, connect, reconnectLocal };

export default client;
