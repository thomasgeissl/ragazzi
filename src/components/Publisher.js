import React, { useState } from "react";
import { useDispatch } from "react-redux";
import styled from "styled-components";

import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";

import { addSentMessage } from "../store/reducers/mqtt";

import { getClient } from "../mqtt";

const Container = styled.div``;
const Form = styled.div`
  button {
    margin-top: 15px;
  }
`;

export default () => {
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const dispatch = useDispatch();
  function handleClick(topic, message) {
    dispatch(addSentMessage(topic, message));
    return getClient().publish(topic, message);
  }
  return (
    <Container>
      <h2>publisher</h2>
      <Form>
        <TextField
          fullWidth
          label="topic"
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
        />
        <TextField
          fullWidth
          multiline
          label="message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
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
      </Form>
    </Container>
  );
};
