import mqtt from "mqtt";
import store from "./store";
import { addReceivedMessage } from "./store/reducers/mqtt";

const client = mqtt.connect("ws://localhost:9001");
client.on("message", function (topic, message) {
  store.dispatch(addReceivedMessage(topic, message.toString()));
});
let secondClient = null;

const getClient = () => {
  return secondClient ? secondClient : client;
};

const connect = (protocol, host, port) => {
  if (secondClient) {
    secondClient.end();
  }
  // const parts = host.split("://");
  // const protocol = parts.length > 1 ? parts[0] : "ws";
  secondClient = mqtt.connect(`${protocol}://${host}:${port}`);
  secondClient.on("message", function (topic, message) {
    store.dispatch(addReceivedMessage(topic, message.toString()));
  });
  console.log("connected to", host, port);
  return secondClient;
};
export { getClient, connect };

export default client;
