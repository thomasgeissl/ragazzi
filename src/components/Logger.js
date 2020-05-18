import React from "react";
import { useSelector } from "react-redux";
import { format } from "date-fns";
import compare from "date-fns/compareDesc";

import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";

export default () => {
  const receivedMessages = useSelector((state) => state.mqtt.receivedMessages);
  const sentMessages = useSelector((state) => state.mqtt.sentMessages);
  const messages = [...receivedMessages, ...sentMessages].sort((a, b) => {
    return compare(a.timestamp, b.timestamp);
  });

  return (
    <TableContainer component={Paper}>
      <Table size="small" aria-label="a dense table">
        <TableHead>
          <TableRow>
            <TableCell>
              <b>Direction</b>
            </TableCell>
            <TableCell>
              <b>Topic</b>
            </TableCell>
            <TableCell>
              <b>Message</b>
            </TableCell>
            <TableCell>
              <b>Timestamp</b>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {messages.map((message, index) => {
            return (
              <TableRow key={index}>
                <TableCell>{message.type}</TableCell>
                <TableCell>{message.topic}</TableCell>
                <TableCell>{message.message}</TableCell>
                <TableCell>{format(message.timestamp, "HH:mm:ss")}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};