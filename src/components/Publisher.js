import React, { useState } from "react";
import styled from "styled-components";

import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";

import client from "../mqtt";

const Container = styled.div`
  padding-left: 15px;
  padding-right: 15px;
`;

export default () => {
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  function handleClick(topic, message) {
    return client.publish(topic, message);
  }
  return (
    <Container>
      <h1>publisher</h1>
      <form>
        <TextField
          fullWidth
          label="topic"
          value={topic}
          onChange={event => setTopic(event.target.value)}
        />
        <TextField
          fullWidth
          multiline
          label="message"
          value={message}
          onChange={event => setMessage(event.target.value)}
        />
        <Button
          primary
          fullWidth
          type="button"
          onClick={() => handleClick(topic, message)}
        >
          publish
        </Button>
      </form>
    </Container>
  );
};
