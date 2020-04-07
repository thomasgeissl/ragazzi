import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";

import Button from "@material-ui/core/Button";
import Checkbox from "@material-ui/core/Checkbox";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import TextField from "@material-ui/core/TextField";
import client from "../mqtt";

import {
  addSubscription,
  subscribe,
  unsubscribe
} from "../store/reducers/mqtt";

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
  const messages = useSelector(state => state.mqtt.receivedMessages);
  const subscriptions = useSelector(state => state.mqtt.subscriptions);
  const dispatch = useDispatch();

  const toggleSubscription = key => {
    return () => {
      if (subscriptions.get(key)) {
        client.unsubscribe(key);
        dispatch(unsubscribe(key));
      } else {
        client.subscribe(key);
        dispatch(subscribe(key));
      }
    };
  };
  return (
    <>
      <h2>subscriber</h2>
      {[...subscriptions.keys()].map(key => {
        return (
          <FormControlLabel
            control={
              <Checkbox
                checked={subscriptions.get(key)}
                onChange={event => toggleSubscription(key)()}
                name={key}
                color="primary"
              />
            }
            label={key}
          />
        );
      })}
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
            dispatch(addSubscription(topic));
            setTopic("");
          }}
        >
          subscribe
        </Button>
      </form>

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
