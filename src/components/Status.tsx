import styled from "@emotion/styled";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import ErrorIcon from "@mui/icons-material/Error";

import { getClient } from "../mqtt";
import { useMqttStore } from "../stores/mqtt";

setInterval(() => {
  useMqttStore.getState().setConnected(getClient().connected);
}, 3000);

const Container = styled.div``;

export default function Status() {
  const connected = useMqttStore((state) => state.connected);
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
