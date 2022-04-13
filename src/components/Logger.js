import React from "react";
import { useSelector } from "react-redux";
import { format } from "date-fns";
import compare from "date-fns/compareDesc";
import styled from "styled-components";

import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import CallReceivedIcon from "@mui/icons-material/CallReceived";
import SendIcon from "@mui/icons-material/Send";

const StyledTable = styled(Table)`
  overflow-wrap: break-word;
`;
export default () => {
  const receivedMessages = useSelector((state) => state.mqtt.receivedMessages);
  const sentMessages = useSelector((state) => state.mqtt.sentMessages);
  const messages = [...receivedMessages, ...sentMessages].sort((a, b) => {
    return compare(a.timestamp, b.timestamp);
  });

  return (
    <TableContainer component={Paper}>
      <StyledTable size="small" aria-label="a dense table">
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
          {messages.map((message, index) => {
            return (
              <TableRow key={index}>
                <TableCell>
                  {message.type === "INCOMING" && (
                    <CallReceivedIcon></CallReceivedIcon>
                  )}
                  {message.type === "OUTGOING" && <SendIcon></SendIcon>}
                </TableCell>
                <TableCell>{message.topic}</TableCell>
                <TableCell>{message.message}</TableCell>
                <TableCell>{format(message.timestamp, "HH:mm:ss")}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </StyledTable>
    </TableContainer>
  );
};
