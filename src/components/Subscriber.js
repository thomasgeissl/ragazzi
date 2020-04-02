import React from "react";
import { useSubscription } from "mqtt-react-hooks";

export default () => {
  const { msgs } = useSubscription("topic");
  console.log(msgs);
  return (
    <>
      <h1>subscriber</h1>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {msgs.map(message => (
          <span key={message.id}>
            {`topic:${message.topic} - message: ${message.message}`}
          </span>
        ))}
      </div>
    </>
  );
};
