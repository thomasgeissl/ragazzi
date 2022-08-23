import React, { useState } from "react";
import { useDispatch } from "react-redux";

import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { getClient } from "../mqtt";

import { addSubscription } from "../store/reducers/mqtt";

export default () => {
  const [topic, setTopic] = useState("");
  const dispatch = useDispatch();
  return (
    <Card>
      <CardContent>
        <Typography color="textPrimary" gutterBottom>
          <b>Subscribe</b>
        </Typography>
        <TextField
          fullWidth
          label="topic"
          size="small"
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
      </CardContent>
      <CardActions>
        <Button
          variant="contained"
          color="primary"
          type="button"
          onClick={() => {
            getClient().subscribe(topic);
            dispatch(addSubscription(topic));
            setTopic("");
          }}
        >
          subscribe
        </Button>
      </CardActions>
    </Card>
  );
};
