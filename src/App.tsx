import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Provider as StoreProvider } from "react-redux";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import styled from "@emotion/styled";
import mqtt, { type MqttClient } from "mqtt";

import Home from "./components/Home";
import Dev from "./components/Dev";
import Footer from "./components/Footer";

import { ThemeProvider } from "@mui/material/styles";
import theme from "./theme";

import store from "./store";
import { reconnectLocal } from "./mqtt";
import type { BrokerSettings } from "./types/ragazzi";

let busClient: MqttClient = mqtt.connect("ws://localhost:9001");
let busWsPort = 9001;

const attachBusHandlers = (client: MqttClient) => {
  client.subscribe("ragazzi");
  client.on("message", (topic, message) => {
    if (topic === "ragazzi") {
      const action = JSON.parse(message.toString());
      store.dispatch(action);
    }
  });
};

attachBusHandlers(busClient);

const reconnectBus = (wsPort: number | string) => {
  const port = Number(wsPort) || 9001;
  if (port === busWsPort) return;
  busWsPort = port;
  try {
    busClient.end(true);
  } catch {
    // ignore disconnect errors while reconnecting
  }
  busClient = mqtt.connect(`ws://localhost:${port}`);
  attachBusHandlers(busClient);
};

const applyBrokerSettings = (settings: BrokerSettings | null | undefined) => {
  if (!settings) return;
  store.dispatch({
    type: "SETBROKERSETTINGS",
    payload: { value: settings },
  });
  reconnectBus(settings.wsPort);
  reconnectLocal(settings.wsPort);
};

if (window.ragazzi?.broker) {
  window.ragazzi.broker.getSettings().then(applyBrokerSettings);
  window.ragazzi.broker.onSettings(applyBrokerSettings);
}

const Container = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
`;
const Content = styled.div`
  flex-grow: 1;
  overflow: scroll;
`;

export default function App() {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0] as File & { path?: string };
    if (!file?.path) return;

    const regex = /(?:\.([^.]+))?$/;
    const ext = regex.exec(file.path);

    if (ext?.includes("html")) {
      busClient.publish("ragazzi/webapp/open", file.path);
    }
    if (ext?.includes("json") || ext?.includes("ragazzi")) {
      busClient.publish("ragazzi/project/open", file.path);
    }
  }, []);
  const { getRootProps } = useDropzone({ onDrop });

  return (
    <StoreProvider store={store}>
      <ThemeProvider theme={theme}>
        <Router>
          <Container {...getRootProps()}>
            <Content>
              <Switch>
                <Route path="/dev">
                  <Dev />
                </Route>
                <Route path="/">
                  <Home />
                </Route>
              </Switch>
            </Content>
            <Footer />
          </Container>
        </Router>
      </ThemeProvider>
    </StoreProvider>
  );
}
