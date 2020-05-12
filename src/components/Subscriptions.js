import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import Checkbox from "@material-ui/core/Checkbox";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Card from "@material-ui/core/Card";
import CardContent from '@material-ui/core/CardContent';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import Typography from '@material-ui/core/Typography';
import { getClient } from "../mqtt";

import {
  subscribe,
  unsubscribe,
} from "../store/reducers/mqtt";

export default () => {

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

      <Card>
      <CardContent>
      <Typography color="textSecondary" gutterBottom>Subscriptions</Typography>

        <List dense>
      {[...subscriptions.keys()].map((key, index) => {
        return (
          <ListItem>
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
          </ListItem>
        );
      })}
      </List>
      </CardContent>
      </Card>

  );
};
