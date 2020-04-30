import React from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";

import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import ErrorIcon from "@material-ui/icons/Error";

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
