import BlockIcon from "@mui/icons-material/Block";
import CheckIcon from "@mui/icons-material/Check";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type React from "react";
import { useEffect, useState } from "react";
import { connect, disconnect } from "../mqtt";
import { useMqttStore } from "../stores/mqtt";

export default function Broker() {
  const connected = useMqttStore((state) => state.connected);
  const connectedProtocol = useMqttStore((state) => state.protocol);
  const connectedHost = useMqttStore((state) => state.host);
  const connectedPort = useMqttStore((state) => state.port);
  const connectionEnabled = useMqttStore((state) => state.connectionEnabled);
  const [protocol, setProtocol] = useState(connectedProtocol);
  const [host, setHost] = useState(connectedHost);
  const [port, setPort] = useState<string | number>(connectedPort);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [expanded, setExpanded] = useState(!connectionEnabled);

  useEffect(() => {
    if (!connectionEnabled) {
      setProtocol(connectedProtocol);
      setHost(connectedHost);
      setPort(connectedPort);
    }
  }, [connectedHost, connectedPort, connectedProtocol, connectionEnabled]);

  const handleConnectionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      connect(protocol, host, port, username, password);
      setExpanded(false);
      return;
    }

    disconnect();
    setExpanded(true);
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
          <Typography variant="caption" color="text.secondary">
            {connectedProtocol}://{connectedHost}:{connectedPort}
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
    <Accordion
      expanded={expanded}
      onChange={(_, value) => setExpanded(value)}
      sx={{ width: "100%" }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
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
          <Box
            onClick={(event) => event.stopPropagation()}
            onFocus={(event) => event.stopPropagation()}
          >
            <Switch
              checked={connectionEnabled}
              onChange={handleConnectionChange}
              slotProps={{ input: { "aria-label": "Broker connection" } }}
            />
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={3} direction="row">
          <Grid size={2}>
            <TextField
              disabled={connectionEnabled}
              fullWidth
              size="small"
              label="protocol"
              select
              value={protocol}
              onChange={(event) => setProtocol(event.target.value)}
            >
              <MenuItem value="ws">ws</MenuItem>
              <MenuItem value="wss">wss (TLS)</MenuItem>
              <MenuItem value="mqtt">mqtt (TCP)</MenuItem>
              <MenuItem value="mqtts">mqtts (TLS)</MenuItem>
            </TextField>
          </Grid>
          <Grid size={4}>
            <TextField
              disabled={connectionEnabled}
              fullWidth
              size="small"
              label="host"
              value={host}
              onChange={(event) => setHost(event.target.value)}
            />
          </Grid>
          <Grid size={2}>
            <TextField
              disabled={connectionEnabled}
              fullWidth
              size="small"
              label="port"
              value={port}
              onChange={(event) => setPort(event.target.value)}
            />
          </Grid>
          <Grid size={2}>
            <TextField
              disabled={connectionEnabled}
              fullWidth
              size="small"
              label="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </Grid>
          <Grid size={2}>
            <TextField
              disabled={connectionEnabled}
              fullWidth
              size="small"
              label="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
}
