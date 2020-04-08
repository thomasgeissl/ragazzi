import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Provider } from "react-redux";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import styled from "styled-components";

import Home from "./components/Home";
import Dev from "./components/Dev";

import store from "./store";
import mqtt from "mqtt";

const client = mqtt.connect("ws://localhost:9001");

client.subscribe("ragazzi");
client.on("message", (topic, message) => {
  if (topic === "ragazzi") {
    const action = JSON.parse(message.toString());
    store.dispatch(action);
  }
});

const Container = styled.div`
  padding-left: 20px;
  padding-right: 20px;
`;
const Dropzone = styled.div`
  width: 100vw;
  height: 100vh;
  outline: none;
`;

function App() {
  const onDrop = useCallback(acceptedFiles => {
    client.publish("ragazzi/project/open", acceptedFiles[0].path);
  }, []);
  const { getRootProps } = useDropzone({ onDrop });
  return (
    <Dropzone {...getRootProps()}>
      <Container>
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
      </Container>
    </Dropzone>
  );
}

export default App;
