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

const connect = (host, port) => {
  if (secondClient) {
    secondClient.end();
  }
  secondClient = mqtt.connect(`ws://${host}:${port}`);
  secondClient.on("message", function (topic, message) {
    store.dispatch(addReceivedMessage(topic, message.toString()));
  });
  console.log("connected to", host, port);
  return secondClient;
};
export { getClient, connect };

export default client;
