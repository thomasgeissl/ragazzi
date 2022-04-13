import React from "react";
import { useSelector } from "react-redux";

import { makeStyles } from "@mui/styles";
import Grid from "@mui/material/Grid";
import Container from "@mui/material/Container";
import Header from "./Header";
import Broker from "./Broker";
import Publisher from "./Publisher";
import Subscriber from "./Subscriber";
import Logger from "./Logger";
import Subscriptions from "./Subscriptions";
import { isSubscribtionListShown } from "../store/reducers/mqtt";

const useStyles = makeStyles({
  container: {
    marginTop: "0px",
    paddingTop: "20px",
  },
  gap: {
    marginTop: "16px",
  },
});

export default () => {
  const subscriptions = useSelector(isSubscribtionListShown);
  const messages = useSelector((state) => {
    return (
      state.mqtt.receivedMessages.length > 0 ||
      state.mqtt.sentMessages.length > 0
    );
  });

  const classes = useStyles();

  return (
    <Container className={classes.container}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Header></Header>
        </Grid>
        <Grid item xs={12}>
          <Broker></Broker>
        </Grid>
        <Grid
          container
          item
          xs={4}
          direction="column"
          alignItems="stretch"
          justify="flex-start"
        >
          <Grid item>
            <Subscriber></Subscriber>
          </Grid>
          <Grid item className={classes.gap}>
            {subscriptions && <Subscriptions></Subscriptions>}
          </Grid>
        </Grid>
        <Grid
          container
          item
          xs={8}
          direction="column"
          alignItems="stretch"
          justify="flex-start"
        >
          <Grid item>
            <Publisher></Publisher>
          </Grid>
          <Grid item className={classes.gap}></Grid>
          {messages && <Logger></Logger>}
        </Grid>
      </Grid>
    </Container>
  );
};
