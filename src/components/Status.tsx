import styled from "@emotion/styled";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import ErrorIcon from "@mui/icons-material/Error";
import React from "react";
import { useSelector } from "react-redux";

import { getClient } from "../mqtt";
import type { RootState } from "../store";
import store from "../store";
import { setConnected } from "../store/reducers/mqtt";

setInterval(() => {
  store.dispatch(setConnected(getClient().connected));
}, 3000);

const Container = styled.div``;

export default function Status() {
  const connected = useSelector((state: RootState) => state.mqtt.connected);
  return (
    <Container>
      <h2>
        status
        {connected && <CheckCircleOutlineIcon />}
        {!connected && <ErrorIcon />}
      </h2>
    </Container>
  );
}
