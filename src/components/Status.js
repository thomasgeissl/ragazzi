import React from "react";
import { useSelector } from "react-redux";
import styled from "@emotion/styled";

import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorIcon from "@mui/icons-material/Error";

import { getClient } from "../mqtt";

import store from "../store";
import { setConnected } from "../store/reducers/mqtt";

setInterval(() => {
  store.dispatch(setConnected(getClient().connected));
}, 3000);

const Container = styled.div``;
export default () => {
  const connected = useSelector((state) => state.mqtt.connected);
  return (
    <Container>
      <h2>
        status
        {connected && <CheckCircleOutlineIcon></CheckCircleOutlineIcon>}
        {!connected && <ErrorIcon></ErrorIcon>}
      </h2>
    </Container>
  );
};
