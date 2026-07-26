import { Buffer } from "node:buffer";
import styled from "@emotion/styled";
import CallReceivedIcon from "@mui/icons-material/CallReceived";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SendIcon from "@mui/icons-material/Send";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { format } from "date-fns";
import compare from "date-fns/compareDesc";
import { useState } from "react";
import { encodePayload, type PayloadEncoding } from "../lib/payload";
import { getClient } from "../mqtt";
import { type MqttMessage, useMqttStore } from "../stores/mqtt";
import Subscriber from "./Subscriber";
import Subscriptions from "./Subscriptions";

const StyledTable = styled(Table)`
  overflow-wrap: break-word;
`;

type MessageRepresentation = PayloadEncoding | "json";

const representationLabels: Record<MessageRepresentation, string> = {
  utf8: "UTF-8",
  hex: "hex",
  base64: "base64",
  uint8: "byte",
  json: "JSON",
};

const globalRepresentationOptions: PayloadEncoding[] = ["utf8", "hex", "base64", "uint8"];

function messagePayload(message: MqttMessage): Buffer {
  const encoded = encodePayload(message.message, message.encoding);
  return typeof encoded.payload === "string"
    ? Buffer.from(encoded.payload, "utf8")
    : encoded.payload;
}

function canRepresentAsJson(message: MqttMessage): boolean {
  try {
    JSON.parse(messagePayload(message).toString("utf8"));
    return true;
  } catch {
    return false;
  }
}

function representMessage(message: MqttMessage, representation: MessageRepresentation): string {
  const payload = messagePayload(message);

  switch (representation) {
    case "utf8":
      return payload.toString("utf8");
    case "hex":
      return payload.toString("hex");
    case "base64":
      return payload.toString("base64");
    case "uint8":
      return Array.from(payload.values()).join(" ");
    case "json":
      return JSON.stringify(JSON.parse(payload.toString("utf8")), null, 2);
  }
}

export default function Logger() {
  const receivedMessages = useMqttStore((state) => state.receivedMessages);
  const sentMessages = useMqttStore((state) => state.sentMessages);
  const showSubscriptions = useMqttStore((state) => state.subscriptions.size > 0);
  const addSentMessage = useMqttStore((state) => state.addSentMessage);
  const clearMessages = useMqttStore((state) => state.clearMessages);
  const messages = [...receivedMessages, ...sentMessages].sort((a, b) => {
    return compare(a.timestamp, b.timestamp);
  });
  const [topicFilter, setTopicFilter] = useState("");
  const [globalRepresentationAnchor, setGlobalRepresentationAnchor] = useState<HTMLElement | null>(
    null,
  );
  const [globalRepresentation, setGlobalRepresentation] = useState<PayloadEncoding | null>(null);
  const [representations, setRepresentations] = useState<Map<MqttMessage, MessageRepresentation>>(
    () => new Map(),
  );

  function sendMessage(topic: string, message: string, encoding: PayloadEncoding) {
    const payload = encodePayload(message, encoding);
    addSentMessage(topic, payload.message, payload.encoding);
    return getClient().publish(topic, payload.payload);
  }

  function setLineRepresentation(message: MqttMessage, representation: MessageRepresentation | "") {
    setRepresentations((current) => {
      const next = new Map(current);
      if (representation) {
        next.set(message, representation);
      } else {
        next.delete(message);
      }
      return next;
    });
  }

  function setGlobalMessageRepresentation(representation: PayloadEncoding | null) {
    setGlobalRepresentation(representation);
    setGlobalRepresentationAnchor(null);
  }

  return (
    <Accordion defaultExpanded sx={{ width: "100%" }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography component="h3" variant="h6">
          subscribe
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ px: 2, pt: 1, pb: 2, width: "100%", boxSizing: "border-box" }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2 }}>
          <Subscriber />
          {showSubscriptions && <Subscriptions />}
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 2,
            width: "100%",
            mb: 2,
            boxSizing: "border-box",
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <TextField
              fullWidth
              label="filter"
              size="small"
              value={topicFilter}
              onChange={(event) => setTopicFilter(event.target.value)}
            />
          </Box>
          <Button variant="contained" type="button" onClick={clearMessages} sx={{ flexShrink: 0 }}>
            clear
          </Button>
        </Box>
        <TableContainer component={Paper} sx={{ overflow: "auto", width: "100%" }} elevation={0}>
          <StyledTable size="small">
            <TableHead>
              <TableRow>
                <TableCell width="5%">
                  <b>Type</b>
                </TableCell>
                <TableCell width="40%">
                  <b>Topic</b>
                </TableCell>
                <TableCell width="40%">
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      "&:hover .global-representation-control, &:focus-within .global-representation-control":
                        { opacity: 1 },
                    }}
                  >
                    <b>Message</b>
                    <Button
                      className="global-representation-control"
                      size="small"
                      type="button"
                      color="inherit"
                      endIcon={<ExpandMoreIcon fontSize="small" />}
                      aria-label="Change representation for all messages"
                      onClick={(event) => setGlobalRepresentationAnchor(event.currentTarget)}
                      sx={{
                        fontSize: "0.625rem",
                        minWidth: 0,
                        opacity: 0,
                        p: 0,
                        textTransform: "none",
                      }}
                    >
                      {globalRepresentation
                        ? `all: ${representationLabels[globalRepresentation]}`
                        : "all: original"}
                    </Button>
                  </Box>
                </TableCell>
                <TableCell width="15%">
                  <b>Timestamp</b>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {messages
                .filter((message) => topicFilter === "" || message.topic.includes(topicFilter))
                .map((message, index) => {
                  const hasOverride = representations.has(message);
                  const representation =
                    representations.get(message) ?? globalRepresentation ?? message.encoding;
                  return (
                    <TableRow key={index}>
                      <TableCell>
                        {message.type === "INCOMING" && <CallReceivedIcon />}
                        {message.type === "OUTGOING" && (
                          <SendIcon
                            onClick={() => {
                              sendMessage(message.topic, message.message, message.encoding);
                            }}
                            style={{ cursor: "pointer" }}
                          />
                        )}
                      </TableCell>
                      <TableCell>{message.topic}</TableCell>
                      <TableCell>
                        <Select
                          value={hasOverride ? representation : ""}
                          displayEmpty
                          variant="standard"
                          aria-label={`Representation for ${message.topic}`}
                          onChange={(event) =>
                            setLineRepresentation(
                              message,
                              event.target.value as MessageRepresentation | "",
                            )
                          }
                          sx={{
                            color: "text.secondary",
                            fontSize: "0.625rem",
                            minWidth: 0,
                            "&::before, &::after": { borderBottom: 0 },
                            "& .MuiSelect-select": { py: 0 },
                          }}
                        >
                          <MenuItem value="">
                            {globalRepresentation
                              ? `Use global (${representationLabels[globalRepresentation]})`
                              : `Use original (${representationLabels[message.encoding]})`}
                          </MenuItem>
                          {(Object.keys(representationLabels) as MessageRepresentation[]).map(
                            (option) => (
                              <MenuItem
                                key={option}
                                value={option}
                                disabled={option === "json" && !canRepresentAsJson(message)}
                              >
                                {representationLabels[option]}
                              </MenuItem>
                            ),
                          )}
                        </Select>
                        <Box component="div" sx={{ whiteSpace: "pre-wrap" }}>
                          {representMessage(message, representation)}
                        </Box>
                      </TableCell>
                      <TableCell>{format(message.timestamp, "HH:mm:ss")}</TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </StyledTable>
        </TableContainer>
        <Menu
          anchorEl={globalRepresentationAnchor}
          open={Boolean(globalRepresentationAnchor)}
          onClose={() => setGlobalRepresentationAnchor(null)}
        >
          <MenuItem onClick={() => setGlobalMessageRepresentation(null)}>
            Original representation
          </MenuItem>
          {globalRepresentationOptions.map((representation) => (
            <MenuItem
              key={representation}
              onClick={() => setGlobalMessageRepresentation(representation)}
            >
              {representationLabels[representation]}
            </MenuItem>
          ))}
        </Menu>
      </AccordionDetails>
    </Accordion>
  );
}
