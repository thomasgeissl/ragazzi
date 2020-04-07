import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import styled from "styled-components";

import client from "../mqtt";

const Container = styled.div``;

export default () => {
  const config = useSelector(state => state.system.config);
  useEffect(() => {
    client.publish("getConfig", "");
  });
  return (
    <Container>
      <h1>home</h1>
      <Link to="/dev">mqtt dev tools</Link>
      <ul>
        {config &&
          Object.entries(config).length !== 0 &&
          config.views &&
          config.views.map(view => {
            return (
              <li>
                <a
                  href={`http://${config.ip}:${config.httpPort}/${view.path}`}
                  target="_blank"
                >
                  {view.title}
                </a>
              </li>
            );
          })}
        {config &&
          Object.entries(config).length !== 0 &&
          config.externalViews &&
          config.externalViews.map(view => {
            return (
              <li>
                <a
                  href={`http://${config.ip}:${config.httpPort}/${view.path}`}
                  target="_blank"
                >
                  {view.title}
                </a>
              </li>
            );
          })}
      </ul>
    </Container>
  );
};
