import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { makeStyles } from '@material-ui/core/styles';
import Button from "@material-ui/core/Button";
import Card from "@material-ui/core/Card";
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import TextField from "@material-ui/core/TextField";
import Typography from '@material-ui/core/Typography';

import { getClient } from "../mqtt";

import {
  addSubscription
} from "../store/reducers/mqtt";


const useStyles = makeStyles({
  subscriber: 
  {
  }
});

export default () => {
  const [topic, setTopic] = useState("");
  const dispatch = useDispatch();
  const classes = useStyles();
  return (

    <Card className={classes.subscriber} >
      <CardContent>
      <Typography color="textSecondary" gutterBottom>Subscribe</Typography>
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
