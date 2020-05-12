import React, { useState } from "react";
import { useDispatch } from "react-redux";

import { makeStyles } from '@material-ui/core/styles';
import Card from "@material-ui/core/Card";
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Typography from '@material-ui/core/Typography';

import { addSentMessage } from "../store/reducers/mqtt";

import { getClient } from "../mqtt";


export default () => {
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const dispatch = useDispatch();
  function handleClick(topic, message) {
    dispatch(addSentMessage(topic, message));
    return getClient().publish(topic, message);
  }
  return (
    <Card>
      <CardContent>
      <Typography color="textSecondary" gutterBottom>Publish</Typography>
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
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleClick(topic, message)
            }
          }}
        />
      </CardContent>
      <CardActions>
        <Button
          variant="contained"
          color="primary"
          type="button"
          onClick={() => handleClick(topic, message)}
        >
          publish
        </Button>
        </CardActions>
    </Card>
  );
};
