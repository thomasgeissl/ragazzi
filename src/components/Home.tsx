import CheckIcon from "@mui/icons-material/Check";
import DesktopWindowsIcon from "@mui/icons-material/DesktopWindows";
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Container from "@mui/material/Container";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type React from "react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { validateBrokerPorts } from "../lib/ports";
import { getClient } from "../mqtt";
import type { RootState } from "../store";

export default function Home() {
  const dispatch = useDispatch();
  const config = useSelector((state: RootState) => state.system.config);
  const broker = useSelector((state: RootState) => state.system.broker);
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

  const handleBrokerToggle = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

      const ports = validateBrokerPorts(wsPortDraft, tcpPortDraft);
      if (!ports.ok) {
        setPortError(ports.error);
        return;
      }

      if (ports.wsPort !== broker.wsPort || ports.tcpPort !== broker.tcpPort) {
        await api.setPorts({
          wsPort: ports.wsPort,
          tcpPort: ports.tcpPort,
        });
      }

      const settings = await api.start();
      dispatch({ type: "SETBROKERSETTINGS", payload: { value: settings } });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not update broker.";
      setPortError(message);
    } finally {
      setBrokerBusy(false);
    }
  };

  const hasBrokerApi = Boolean(window.ragazzi?.broker);
  const views = config.views ?? [];
  const externalViews = config.externalViews ?? [];

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
                    slotProps={{ htmlInput: { min: 1, max: 65535 } }}
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
                    slotProps={{ htmlInput: { min: 1, max: 65535 } }}
                  />
                </Grid>
              </Grid>
            )}

            {portError && (
              <Typography variant="caption" color="error" sx={{ display: "block", mb: 1 }}>
                {portError}
              </Typography>
            )}

            <Typography variant="caption">
              {broker.running ? (
                <>
                  Your friendly mqtt broker is up and running at <b>{config.ip}</b>.
                  <br />
                  It communicates on ports <b>{broker.wsPort}</b> (ws) and <b>{broker.tcpPort}</b>{" "}
                  (tcp).
                </>
              ) : (
                <>The mqtt broker is stopped. Set the ports above, then turn it on.</>
              )}
            </Typography>
          </CardContent>
        </Card>

        {views.length === 0 && (
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
            <Button variant="outlined" color="primary" component={Link} to="/dev">
              mqtt dev tools
            </Button>
          </Box>
        )}

        {Object.entries(config).length > 0 && (views.length > 0 || externalViews.length > 0) && (
          <Grid container spacing={2}>
            <Grid size={6}>
              <Card>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 2,
                    }}
                  >
                    <Grid container spacing={1} sx={{ maxHeight: "24px" }}>
                      <Grid>
                        <Box sx={{ color: "success.main" }}>
                          <CheckIcon />
                        </Box>
                      </Grid>
                      <Grid>
                        <Typography sx={{ color: "success.main" }}>project is hosted</Typography>
                      </Grid>
                    </Grid>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      type="button"
                      onClick={() => {
                        getClient().publish("ragazzi/project/close", "");
                      }}
                    >
                      shutdown
                    </Button>
                  </Box>
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
                      {views.map((view, index) => {
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
                      {Object.entries(config).length !== 0 &&
                        externalViews.map((view, index) => {
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
                          config.externalHttpPort !== 80 ? ":" + config.externalHttpPort : ""
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
}
