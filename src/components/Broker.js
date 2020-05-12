import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { makeStyles } from '@material-ui/core/styles';
import Card from "@material-ui/core/Card";
import CardActions from "@material-ui/core/CardActions";
import CardContent from '@material-ui/core/CardContent';
import Collapse from '@material-ui/core/Collapse';
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Grid from "@material-ui/core/Grid";
import Box from "@material-ui/core/Box";
import Typography from '@material-ui/core/Typography';
import CheckIcon from '@material-ui/icons/Check';
import BlockIcon from '@material-ui/icons/Block';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Divider from '@material-ui/core/Divider';

import { setBroker, unsubscribeAll } from "../store/reducers/mqtt";
import { connect, getClient } from "../mqtt";

import store from "../store";
import { setConnected } from "../store/reducers/mqtt";

setInterval(() => {
  store.dispatch(setConnected(getClient().connected));
}, 3000);

const useStyles = makeStyles({
  card: {
    padding: '16px'
  },
  arrowDefault: {
    transform: 'rotate(0deg)'
  },
  arrowExpanded: {
    transform: 'rotate(180deg)'
  }
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
    setExpanded(!expanded)
  }

  function Status(props) {
    if(connected) 
      return <Grid container spacing={1}><Grid item><Box color="success.main"><CheckIcon></CheckIcon></Box></Grid><Grid item><Typography><Box color="success.main">connected to broker</Box></Typography></Grid></Grid>
    else 
      return <Grid container spacing={1}><Grid item><Box color="primary.main"><BlockIcon></BlockIcon></Box></Grid><Grid item><Typography><Box color="primary.main">no connection to broker</Box></Typography></Grid></Grid>
  }

  const classes = useStyles();

  return (
    <Card>
      <CardActions disableSpacing className={classes.card}>
        <Grid item container direction="row" justify="space-between" alignItems="center">
          <Grid item>
              <Status></Status>
            </Grid>
            <Grid item onClick={handleExpandClick} >
              <Typography><ExpandMoreIcon className={expanded ? classes.arrowExpanded : classes.arrowDefault}></ExpandMoreIcon></Typography>
            </Grid>
        </Grid>
      </CardActions>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
      <Divider />
      <CardContent>
        <Grid container spacing={3} direction="row" justify="space-between" alignItems="center">
            <Grid item container spacing={3} xs={8}>
              <Grid item xs={8}>
              <TextField
                fullWidth
                label="host"
                value={host}
                onChange={(event) => setHost(event.target.value)}
              />
              </Grid>
              <Grid item xs={4}>
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
