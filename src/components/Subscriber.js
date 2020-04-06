import React, { useState } from "react";
import { useSelector } from "react-redux";

import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import client from "../mqtt";

export default () => {
  const [topic, setTopic] = useState("");
  const messages = useSelector(state => state.mqtt.receivedMessages);
  return (
    <>
      <h1>subscriber</h1>
      <form>
        <TextField
          fullWidth
          label="topic"
          value={topic}
          onChange={event => setTopic(event.target.value)}
        />
        <Button
          primary
          fullWidth
          type="button"
          onClick={() => {
            client.subscribe(topic);
            setTopic("");
          }}
        >
          subscribe
        </Button>
      </form>
      <ul>
        {messages.map((message, index) => {
          return (
            <li key={index}>
              {message.topic}
              <br></br>
              {message.message}
            </li>
          );
        })}
      </ul>
    </>
  );
};
