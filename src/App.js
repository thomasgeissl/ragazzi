import React from "react";
import logo from "./logo.svg";
import "./App.css";
import { Connector } from "mqtt-react-hooks";
import Status from "./components/Status";
import Publisher from "./components/Publisher";
import Subscriber from "./components/Subscriber";

function App() {
  return (
    <div className="App">
      <Connector brokerUrl="ws://localhost:9001">
        <Status></Status>
        {/* <Publisher></Publisher>
        <Subscriber></Subscriber> */}
      </Connector>
    </div>
  );
}

export default App;
