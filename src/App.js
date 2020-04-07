import React from "react";
import { Provider } from "react-redux";
import styled from "styled-components";

import Status from "./components/Status";
import Publisher from "./components/Publisher";
import Subscriber from "./components/Subscriber";

import store from "./store";

const Container = styled.div`
  padding-left: 20px;
  padding-right: 20px;
`;

function App() {
  return (
    <Container>
      <Provider store={store}>
        <Status></Status>
        <Publisher></Publisher>
        <Subscriber></Subscriber>
      </Provider>
    </Container>
  );
}

export default App;
