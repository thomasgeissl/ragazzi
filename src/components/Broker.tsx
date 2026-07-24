import BlockIcon from "@mui/icons-material/Block";
import CheckIcon from "@mui/icons-material/Check";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Collapse from "@mui/material/Collapse";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { connect, getClient } from "../mqtt";
import type { RootState } from "../store";

import store from "../store";
import { setBroker, setConnected, unsubscribeAll } from "../store/reducers/mqtt";

setInterval(() => {
  store.dispatch(setConnected(getClient().connected));
}, 3000);

export default function Broker() {
  const [protocol, setProtocol] = useState("ws");
  const [host, setHost] = useState("localhost");
  const [port, setPort] = useState<string | number>(9001);
  const connected = useSelector((state: RootState) => state.mqtt.connected);
  const connectedProtocol = useSelector((state: RootState) => state.mqtt.protocol);
  const connectedHost = useSelector((state: RootState) => state.mqtt.host);
  const connectedPort = useSelector((state: RootState) => state.mqtt.port);
  const subscriptions = useSelector((state: RootState) => state.mqtt.subscriptions);
  const dispatch = useDispatch();
  const [expanded, setExpanded] = React.useState(false);

  function handleClick(nextProtocol: string, nextHost: string, nextPort: string | number) {
    [...subscriptions.keys()].forEach((key) => {
      getClient().unsubscribe(key);
    });
    dispatch(unsubscribeAll());
    dispatch(setBroker(nextProtocol, nextHost, Number(nextPort)));
    connect(nextProtocol, nextHost, nextPort);
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
            sx={{ justifyContent: "space-between", alignItems: "center" }}
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
                  Number(port) === connectedPort
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
}
