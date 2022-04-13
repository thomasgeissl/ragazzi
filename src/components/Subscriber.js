import React, { useState } from "react";
import { useDispatch } from "react-redux";

import { makeStyles } from "@mui/styles";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { getClient } from "../mqtt";

import { addSubscription } from "../store/reducers/mqtt";

const useStyles = makeStyles({
  subscriber: {},
});

export default () => {
  const [topic, setTopic] = useState("");
  const dispatch = useDispatch();
  const classes = useStyles();
  return (
    <Card className={classes.subscriber}>
      <CardContent>
        <Typography color="textPrimary" gutterBottom>
          <b>Subscribe</b>
        </Typography>
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
