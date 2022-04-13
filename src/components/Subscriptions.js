import React from "react";
import { useDispatch, useSelector } from "react-redux";

import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Typography from "@mui/material/Typography";
import { getClient } from "../mqtt";

import { subscribe, unsubscribe } from "../store/reducers/mqtt";

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
        <Typography color="textPrimary" gutterBottom>
          <b>Subscriptions</b>
        </Typography>

        <List dense>
          {[...subscriptions.keys()].map((key, index) => {
            return (
              <ListItem key={index}>
                <FormControlLabel
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
