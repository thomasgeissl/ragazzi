import React from "react";
import { Provider } from "react-redux";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import styled from "styled-components";

import Home from "./components/Home";
import Dev from "./components/Dev";

import store from "./store";

const Container = styled.div`
  padding-left: 20px;
  padding-right: 20px;
`;

function App() {
  return (
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
  );
}

export default App;
