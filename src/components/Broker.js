import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { makeStyles } from "@mui/styles";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Collapse from "@mui/material/Collapse";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CheckIcon from "@mui/icons-material/Check";
import BlockIcon from "@mui/icons-material/Block";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Divider from "@mui/material/Divider";

import { setBroker, unsubscribeAll } from "../store/reducers/mqtt";
import { connect, getClient } from "../mqtt";

import store from "../store";
import { setConnected } from "../store/reducers/mqtt";

setInterval(() => {
  store.dispatch(setConnected(getClient().connected));
}, 3000);

const useStyles = makeStyles({
  card: {
    padding: "16px",
  },
  arrowDefault: {
    transform: "rotate(0deg)",
  },
  arrowExpanded: {
    transform: "rotate(180deg)",
  },
});

export default () => {
  const [host, setHost] = useState("localhost");
  const [port, setPort] = useState(9001);
  const connected = useSelector((state) => state.mqtt.connected);
  const connectedHost = useSelector((state) => state.mqtt.host);
  const connectedPort = useSelector((state) => state.mqtt.port);
  const subscriptions = useSelector((state) => state.mqtt.subscriptions);
  const dispatch = useDispatch();
  const [expanded, setExpanded] = React.useState(false);
  function handleClick(host, port) {
    [...subscriptions.keys()].forEach((key) => {
      getClient().unsubscribe(key);
    });
    dispatch(unsubscribeAll());
    dispatch(setBroker(host, port));
    connect(host, port);
  }
  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  function Status(props) {
    if (connected)
      return (
        <Grid container spacing={1}>
          <Grid item>
            <Box color="success.main">
              <CheckIcon></CheckIcon>
            </Box>
          </Grid>
          <Grid item>
            <Box color="success.main">connected to broker</Box>
          </Grid>
        </Grid>
      );
    else
      return (
        <Grid container spacing={1}>
          <Grid item>
            <Box color="primary.main">
              <BlockIcon></BlockIcon>
            </Box>
          </Grid>
          <Grid item>
            <Box color="primary.main">no connection to broker</Box>
          </Grid>
        </Grid>
      );
  }

  const classes = useStyles();

  return (
    <Card>
      <CardActions disableSpacing className={classes.card}>
        <Grid
          item
          container
          direction="row"
          justify="space-between"
          alignItems="center"
        >
          <Grid item>
            <Status></Status>
          </Grid>
          <Grid item onClick={handleExpandClick}>
            <Typography>
              <ExpandMoreIcon
                className={
                  expanded ? classes.arrowExpanded : classes.arrowDefault
                }
              ></ExpandMoreIcon>
            </Typography>
          </Grid>
        </Grid>
      </CardActions>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Divider />
        <CardContent>
          <Grid
            container
            spacing={3}
            direction="row"
            justify="space-between"
            alignItems="center"
          >
            <Grid item container spacing={3} xs={8}>
              <Grid item xs={10}>
                <TextField
                  fullWidth
                  label="host"
                  value={host}
                  onChange={(event) => setHost(event.target.value)}
                />
              </Grid>
              <Grid item xs={2}>
                <TextField
                  fullWidth
                  label="port"
                  value={port}
                  onChange={(event) => setPort(event.target.value)}
                />
              </Grid>
            </Grid>
            {/* <Grid item xs={2}>
            <Typography color="textSecondary" variant="caption">status</Typography>
            <br/>
              {connected && <CheckIcon></CheckIcon>}
              {!connected && <BlockIcon></BlockIcon>}
            </Grid> */}
            <Grid item>
              <Button
                disabled={
                  connected && host === connectedHost && port === connectedPort
                    ? true
                    : false
                }
                variant="contained"
                color="primary"
                type="button"
                justify="right"
                onClick={() => handleClick(host, port)}
              >
                connect
              </Button>
            </Grid>
          </Grid>
        </CardContent>
        {/* <CardActions>
          <Button
              disabled={
                connected && host === connectedHost && port === connectedPort
                  ? true
                  : false
              }
              variant="contained"
              color="primary"
              type="button"
              justify="right"
              onClick={() => handleClick(host, port)}
            >
              connect
            </Button>
        </CardActions> */}
      </Collapse>
    </Card>
  );
};
