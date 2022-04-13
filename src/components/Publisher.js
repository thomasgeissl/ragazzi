import React, { useState } from "react";
import { useDispatch } from "react-redux";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

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
        <Typography color="textPrimary" gutterBottom>
          <b>Publish</b>
        </Typography>
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
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleClick(topic, message);
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
