import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Provider as StoreProvider } from "react-redux";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import styled from "@emotion/styled";
import mqtt from "mqtt";

import Home from "./components/Home";
import Dev from "./components/Dev";
import Footer from "./components/Footer";

import { ThemeProvider } from "@mui/material/styles";
import theme from "./theme";

import store from "./store";

const client = mqtt.connect("ws://localhost:9001");

client.subscribe("ragazzi");
client.on("message", (topic, message) => {
  if (topic === "ragazzi") {
    const action = JSON.parse(message.toString());
    store.dispatch(action);
  }
});

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

export default () => {
  const onDrop = useCallback((acceptedFiles) => {
    const regex = /(?:\.([^.]+))?$/;
    const ext = regex.exec(acceptedFiles[0].path);

    if (ext.includes("html")) {
      client.publish("ragazzi/webapp/open", acceptedFiles[0].path);
    }
    if (ext.includes("json") || ext.includes("ragazzi")) {
      client.publish("ragazzi/project/open", acceptedFiles[0].path);
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
            <Footer></Footer>
          </Container>
        </Router>
      </ThemeProvider>
    </StoreProvider>
  );
};
