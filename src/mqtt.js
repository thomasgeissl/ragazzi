import mqtt from "mqtt";
import store from "./store";
import { addReceivedMessage } from "./store/reducers/mqtt";

const client = mqtt.connect("ws://localhost:9001");
client.on("connect", function() {
  client.subscribe("test", function(err) {});
});

client.on("message", function(topic, message) {
  store.dispatch(addReceivedMessage(topic, message.toString()));
});

export default client;
