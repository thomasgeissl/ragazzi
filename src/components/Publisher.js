import React from "react";
import { useMqttState } from "mqtt-react-hooks";

export default () => {
  const { mqtt } = useMqttState();
  function handleClick(message) {
    return mqtt.publish("topic", message);
  }
  return (
    <>
      <h1>publisher</h1>
      <button type="button" onClick={() => handleClick("false")}>
        Disable led
      </button>
    </>
  );
};
