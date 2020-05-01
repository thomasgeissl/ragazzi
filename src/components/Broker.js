import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";

import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Grid from "@material-ui/core/Grid";

import { setBroker } from "../store/reducers/mqtt";
import { connect } from "../mqtt";

const Container = styled.div``;
const Form = styled.div`
  button {
    margin-top: 15px;
  }
`;

export default () => {
  const [host, setHost] = useState("localhost");
  const [port, setPort] = useState(9001);
  const connected = useSelector((state) => state.mqtt.connected);
  const connectedHost = useSelector((state) => state.mqtt.host);
  const connectedPort = useSelector((state) => state.mqtt.port);
  const dispatch = useDispatch();
  function handleClick(host, port) {
    dispatch(setBroker(host, port));
    connect(host, port);
  }
  return (
    <Container>
      <h2>broker</h2>
      <Form>
        <Grid container spacing={3}>
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
          <Button
            disabled={
              connected && host === connectedHost && port === connectedPort
                ? true
                : false
            }
            variant="contained"
            color="primary"
            fullWidth
            type="button"
            onClick={() => handleClick(host, port)}
          >
            connect
          </Button>
        </Grid>
      </Form>
    </Container>
  );
};
