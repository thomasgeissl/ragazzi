import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import styled from "styled-components";

import Button from "@material-ui/core/Button";

import client from "../mqtt";

const Container = styled.div``;

export default () => {
  const config = useSelector(state => state.system.config);
  useEffect(() => {
    client.publish("getConfig", "");
  });
  return (
    <Container>
      <h1>ciao ragazzi</h1>
      {!config || !config.views || (
        <Button
          variant="contained"
          color="primary"
          fullWidth
          type="button"
          onClick={event => {
            client.publish("openProject", "");
          }}
        >
          open
        </Button>
      )}
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
