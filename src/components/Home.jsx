import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import { Link } from "react-router-dom";
import Grid from "@mui/material/Grid";
import CheckIcon from "@mui/icons-material/Check";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import DesktopWindowsIcon from "@mui/icons-material/DesktopWindows";
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";

import { getClient } from "../mqtt";

export default () => {
  const dispatch = useDispatch();
  const config = useSelector((state) => state.system.config);
  const broker = useSelector((state) => state.system.broker);
  const [brokerBusy, setBrokerBusy] = useState(false);
  const [wsPortDraft, setWsPortDraft] = useState(String(broker.wsPort));
  const [tcpPortDraft, setTcpPortDraft] = useState(String(broker.tcpPort));
  const [portError, setPortError] = useState("");

  useEffect(() => {
    setWsPortDraft(String(broker.wsPort));
    setTcpPortDraft(String(broker.tcpPort));
  }, [broker.wsPort, broker.tcpPort]);

  useEffect(() => {
    if (broker.running) {
      getClient().publish("ragazzi/project/config/get", "");
    }
  }, [broker.running]);

  useEffect(() => {
    const api = window.ragazzi?.broker;
    if (!api) return undefined;

    api.getSettings().then((settings) => {
      dispatch({ type: "SETBROKERSETTINGS", payload: { value: settings } });
    });

    return api.onSettings((settings) => {
      dispatch({ type: "SETBROKERSETTINGS", payload: { value: settings } });
      setBrokerBusy(false);
      setPortError("");
    });
  }, [dispatch]);

  const handleBrokerToggle = async (event) => {
    const api = window.ragazzi?.broker;
    if (!api || brokerBusy) return;

    const shouldRun = event.target.checked;
    setBrokerBusy(true);
    setPortError("");

    try {
      if (!shouldRun) {
        const settings = await api.stop();
        dispatch({ type: "SETBROKERSETTINGS", payload: { value: settings } });
        return;
      }

      const nextWs = Number(wsPortDraft);
      const nextTcp = Number(tcpPortDraft);

      if (
        !Number.isInteger(nextWs) ||
        !Number.isInteger(nextTcp) ||
        nextWs < 1 ||
        nextWs > 65535 ||
        nextTcp < 1 ||
        nextTcp > 65535
      ) {
        setPortError("Ports must be integers between 1 and 65535.");
        return;
      }

      if (nextWs === nextTcp) {
        setPortError("WebSocket and TCP ports must be different.");
        return;
      }

      if (nextWs !== broker.wsPort || nextTcp !== broker.tcpPort) {
        await api.setPorts({ wsPort: nextWs, tcpPort: nextTcp });
      }

      const settings = await api.start();
      dispatch({ type: "SETBROKERSETTINGS", payload: { value: settings } });
    } catch (err) {
      setPortError(err?.message || "Could not update broker.");
    } finally {
      setBrokerBusy(false);
    }
  };

  const hasBrokerApi = Boolean(window.ragazzi?.broker);

  return (
    <Container>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: "20px" }}>
        <Typography variant="h2" color="primary">
          <i>ciao ragazzi.</i>
        </Typography>

        <Card>
          <CardContent>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
                mb: broker.running ? 1 : 2,
              }}
            >
              <Typography variant="subtitle2">MQTT broker</Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={broker.running}
                    onChange={handleBrokerToggle}
                    disabled={brokerBusy || !hasBrokerApi}
                    color="primary"
                  />
                }
                label={broker.running ? "on" : "off"}
                labelPlacement="start"
                sx={{ mr: 0 }}
              />
            </Box>

            {!broker.running && (
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="WebSocket port"
                    type="number"
                    value={wsPortDraft}
                    onChange={(event) => setWsPortDraft(event.target.value)}
                    disabled={brokerBusy || !hasBrokerApi}
                    inputProps={{ min: 1, max: 65535 }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="TCP port"
                    type="number"
                    value={tcpPortDraft}
                    onChange={(event) => setTcpPortDraft(event.target.value)}
                    disabled={brokerBusy || !hasBrokerApi}
                    inputProps={{ min: 1, max: 65535 }}
                  />
                </Grid>
              </Grid>
            )}

            {portError && (
              <Typography
                variant="caption"
                color="error"
                display="block"
                sx={{ mb: 1 }}
              >
                {portError}
              </Typography>
            )}

            <Typography variant="caption">
              {broker.running ? (
                <>
                  Your friendly mqtt broker is up and running at{" "}
                  <b>{config.ip}</b>.
                  <br />
                  It communicates on ports <b>{broker.wsPort}</b> (ws) and{" "}
                  <b>{broker.tcpPort}</b> (tcp).
                </>
              ) : (
                <>
                  The mqtt broker is stopped. Set the ports above, then turn it
                  on.
                </>
              )}
            </Typography>
          </CardContent>
        </Card>

        {(!config || !config.views || config.views.length === 0) && (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="contained"
              color="primary"
              type="button"
              onClick={() => {
                getClient().publish("ragazzi/project/open/choose", "");
              }}
            >
              open project
            </Button>
            <Button
              variant="outlined"
              color="primary"
              component={Link}
              to="/dev"
            >
              mqtt dev tools
            </Button>
          </Box>
        )}

        {config &&
          Object.entries(config).length > 0 &&
          config.views &&
          (config.views.length > 0 || config.externalViews.length > 0) && (
            <Grid container spacing={2}>
              <Grid size={6}>
                <Card>
                  <CardContent>
                    <Grid container spacing={1} sx={{ maxHeight: "24px" }}>
                      <Grid>
                        <Box sx={{ color: "success.main" }}>
                          <CheckIcon />
                        </Box>
                      </Grid>
                      <Grid>
                        <Typography sx={{ color: "success.main" }}>
                          project is hosted
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={6}>
                <Card>
                  <CardContent>
                    <Typography color="text.primary" gutterBottom>
                      <b>Views</b>
                    </Typography>
                    <Typography variant="body1" component="div">
                      <List>
                        {config.views &&
                          config.views.map((view, index) => {
                            return (
                              <ListItem key={index}>
                                <ListItemIcon sx={{ minWidth: "36px" }}>
                                  <DesktopWindowsIcon />
                                </ListItemIcon>
                                <a
                                  href={`http://${config.ip}:${config.internalHttpPort}/${view.path}?broker=${config.ip}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {view.title}
                                </a>
                              </ListItem>
                            );
                          })}
                        {config &&
                          Object.entries(config).length !== 0 &&
                          config.externalViews &&
                          config.externalViews.map((view, index) => {
                            return (
                              <ListItem key={index}>
                                <ListItemIcon sx={{ minWidth: "36px" }}>
                                  <PhoneAndroidIcon />
                                </ListItemIcon>
                                <a
                                  href={`http://${config.ip}:${config.internalHttpPort}/${view.path}?broker=${config.ip}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {view.title}
                                </a>
                              </ListItem>
                            );
                          })}
                      </List>
                      <Typography variant="caption">
                        On external devices navigate to
                        <b>
                          {" "}
                          {`http://${config.ip}${
                            config.externalHttpPort !== 80
                              ? ":" + config.externalHttpPort
                              : ""
                          }`}{" "}
                        </b>
                        and select the corresponding view.
                      </Typography>
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
      </Box>
    </Container>
  );
};
