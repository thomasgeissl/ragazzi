import React, { useState } from "react";
import { useDispatch } from "react-redux";
import styled from "styled-components";

import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";

import { addSentMessage } from "../store/reducers/mqtt";

import client from "../mqtt";

const Container = styled.div``;

export default () => {
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const dispatch = useDispatch();
  function handleClick(topic, message) {
    dispatch(addSentMessage(topic, message));
    return client.publish(topic, message);
  }
  return (
    <Container>
      <h2>publisher</h2>
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
        variant="contained"
        color="primary"
        fullWidth
        type="button"
        onClick={() => handleClick(topic, message)}
      >
        publish
      </Button>
    </Container>
  );
};
