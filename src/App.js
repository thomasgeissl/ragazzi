import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Provider } from "react-redux";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import styled from "styled-components";
import mqtt from "mqtt";

import Home from "./components/Home";
import Dev from "./components/Dev";
import Footer from "./components/Footer";

import Box from "@mui/material/Box";
import { ThemeProvider } from "@mui/material/styles";
import theme from "./theme"

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
`;
const ContentBox = styled(Box)`
  width: 100%;
  height: 100%;
`;
export default () => {
  const onDrop = useCallback((acceptedFiles) => {
    const regex = /(?:\.([^.]+))?$/;
    const ext = regex.exec(acceptedFiles[0].path);

    if (ext.includes("html")) {
      client.publish("ragazzi/webapp/open", acceptedFiles[0].path);
      console.log("open html");
    }
    if (ext.includes("json") || ext.includes("ragazzi")) {
      client.publish("ragazzi/project/open", acceptedFiles[0].path);
    }
  }, []);
  const { getRootProps } = useDropzone({ onDrop });

  return (
    <Container>
      <ThemeProvider theme={theme}>
        <ContentBox display="flex" flexDirection="column" {...getRootProps()}>
          <Box flexGrow={1}>
            <Provider store={store}>
              <Router>
                <Switch>
                  <Route path="/dev">
                    <Dev />
                  </Route>
                  <Route path="/">
                    <Home />
                  </Route>
                </Switch>
              </Router>
            </Provider>
          </Box>
          <Footer></Footer>
        </ContentBox>
      </ThemeProvider>
    </Container>
  );
};
