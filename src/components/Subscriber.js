import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";

import Button from "@material-ui/core/Button";
import Checkbox from "@material-ui/core/Checkbox";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import TextField from "@material-ui/core/TextField";
import { getClient } from "../mqtt";

import {
  addSubscription,
  subscribe,
  unsubscribe,
} from "../store/reducers/mqtt";

const Form = styled.div`
  button {
    margin-top: 15px;
  }
`;

const Logger = styled.ul`
  max-height: 200px;
  overflow: scroll;
  list-style-type: none;
  padding-left: 0;
  li:nth-child(even) {
    background-color: rgb(240, 240, 240);
  }
`;
const Entry = styled.li`
  padding: 5px;
`;

export default () => {
  const [topic, setTopic] = useState("");
  const messages = useSelector((state) => state.mqtt.receivedMessages);
  const subscriptions = useSelector((state) => state.mqtt.subscriptions);
  const dispatch = useDispatch();

  const toggleSubscription = (key) => {
    return () => {
      if (subscriptions.get(key)) {
        getClient().unsubscribe(key);
        dispatch(unsubscribe(key));
      } else {
        getClient().subscribe(key);
        dispatch(subscribe(key));
      }
    };
  };
  return (
    <>
      <h2>subscriber</h2>

      {[...subscriptions.keys()].map((key, index) => {
        return (
          <FormControlLabel
            key={index}
            control={
              <Checkbox
                checked={subscriptions.get(key)}
                onChange={(event) => toggleSubscription(key)()}
                name={key}
                color="primary"
              />
            }
            label={key}
          />
        );
      })}
      <Form>
        <TextField
          fullWidth
          label="topic"
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              getClient().subscribe(topic);
              dispatch(addSubscription(topic));
              setTopic("");
            }
          }}
        />
        <Button
          variant="contained"
          color="primary"
          fullWidth
          type="button"
          onClick={() => {
            getClient().subscribe(topic);
            dispatch(addSubscription(topic));
            setTopic("");
          }}
        >
          subscribe
        </Button>
      </Form>

      <Logger>
        {messages.map((message, index) => {
          return (
            <Entry key={index}>
              {message.topic}
              <br></br>
              {message.message}
            </Entry>
          );
        })}
      </Logger>
    </>
  );
};
