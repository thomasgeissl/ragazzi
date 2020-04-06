import React from "react";
import { Connector } from "mqtt-react-hooks";
import Status from "./components/Status";
import Publisher from "./components/Publisher";
import Subscriber from "./components/Subscriber";

import { Provider } from "react-redux";
import store from "./store";

function App() {
  return (
    <div className="App">
      <Provider store={store}>
        <Connector brokerUrl="ws://localhost:9001">
          <Status></Status>
          <Publisher></Publisher>
          <Subscriber></Subscriber>
        </Connector>
      </Provider>
    </div>
  );
}

export default App;
