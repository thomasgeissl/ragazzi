import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

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
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import Divider from "@mui/material/Divider";

import { setBroker, unsubscribeAll } from "../store/reducers/mqtt";
import { connect, getClient } from "../mqtt";

import store from "../store";
import { setConnected } from "../store/reducers/mqtt";

setInterval(() => {
  store.dispatch(setConnected(getClient().connected));
}, 3000);

export default () => {
  const [protocol, setProtocol] = useState("ws");
  const [host, setHost] = useState("localhost");
  const [port, setPort] = useState(9001);
  const connected = useSelector((state) => state.mqtt.connected);
  const connectedProtocol = useSelector((state) => state.mqtt.protocol);
  const connectedHost = useSelector((state) => state.mqtt.host);
  const connectedPort = useSelector((state) => state.mqtt.port);
  const subscriptions = useSelector((state) => state.mqtt.subscriptions);
  const dispatch = useDispatch();
  const [expanded, setExpanded] = React.useState(false);
  function handleClick(protocol, host, port) {
    [...subscriptions.keys()].forEach((key) => {
      getClient().unsubscribe(key);
    });
    dispatch(unsubscribeAll());
    dispatch(setBroker(protocol, host, port));
    connect(protocol, host, port);
  }
  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  function Status() {
    if (connected)
      return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box sx={{ color: "success.main", display: "flex" }}>
            <CheckIcon />
          </Box>
          <Typography component="h3" variant="h6" sx={{ color: "success.main" }}>
            connected to broker
          </Typography>
        </Box>
      );
    else
      return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box sx={{ color: "primary.main", display: "flex" }}>
            <BlockIcon />
          </Box>
          <Typography component="h3" variant="h6" sx={{ color: "primary.main" }}>
            no connection to broker
          </Typography>
        </Box>
      );
  }

  return (
    <Card sx={{ width: "100%" }}>
      <CardActions disableSpacing sx={{ p: "16px", width: "100%" }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
          }}
        >
          <Box sx={{ flexGrow: 1 }}>
            <Status />
          </Box>
          <Box onClick={handleExpandClick} sx={{ cursor: "pointer" }}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </Box>
        </Box>
      </CardActions>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Divider />
        <CardContent>
          <Grid
            container
            spacing={3}
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Grid container spacing={3} size={9}>
              <Grid size={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="protocol"
                  value={protocol}
                  onChange={(event) => setProtocol(event.target.value)}
                />
              </Grid>
              <Grid size={7}>
                <TextField
                  fullWidth
                  size="small"
                  label="host"
                  value={host}
                  onChange={(event) => setHost(event.target.value)}
                />
              </Grid>
              <Grid size={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="port"
                  value={port}
                  onChange={(event) => setPort(event.target.value)}
                />
              </Grid>
            </Grid>
            <Grid size={3}>
              <Button
                fullWidth
                disabled={
                  connected &&
                  protocol === connectedProtocol &&
                  host === connectedHost &&
                  port === connectedPort
                }
                variant="contained"
                color="primary"
                type="button"
                onClick={() => handleClick(protocol, host, port)}
              >
                connect
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Collapse>
    </Card>
  );
};
