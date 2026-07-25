import styled from "@emotion/styled";
import CallReceivedIcon from "@mui/icons-material/CallReceived";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SendIcon from "@mui/icons-material/Send";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
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
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { encodePayload, type PayloadEncoding } from "../lib/payload";
import { getClient } from "../mqtt";
import type { RootState } from "../store";
import store from "../store/index";
import { addSentMessage, clearMessages, isSubscriptionListShown } from "../store/reducers/mqtt";
import Subscriber from "./Subscriber";
import Subscriptions from "./Subscriptions";

const StyledTable = styled(Table)`
  overflow-wrap: break-word;
`;

export default function Logger() {
  const receivedMessages = useSelector((state: RootState) => state.mqtt.receivedMessages);
  const sentMessages = useSelector((state: RootState) => state.mqtt.sentMessages);
  const showSubscriptions = useSelector(isSubscriptionListShown);
  const messages = [...receivedMessages, ...sentMessages].sort((a, b) => {
    return compare(a.timestamp, b.timestamp);
  });
  const [topicFilter, setTopicFilter] = useState("");
  const dispatch = useDispatch();

  function sendMessage(topic: string, message: string, encoding: PayloadEncoding) {
    const payload = encodePayload(message, encoding);
    dispatch(addSentMessage(topic, payload.message, payload.encoding));
    return getClient().publish(topic, payload.payload);
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
          <Button
            variant="contained"
            type="button"
            onClick={() => store.dispatch(clearMessages())}
            sx={{ flexShrink: 0 }}
          >
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
                  <b>Message</b>
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
                        {message.encoding === "utf8"
                          ? message.message
                          : `${message.encoding}: ${message.message}`}
                      </TableCell>
                      <TableCell>{format(message.timestamp, "HH:mm:ss")}</TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </StyledTable>
        </TableContainer>
      </AccordionDetails>
    </Accordion>
  );
}
