import React, { useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import styled from "styled-components";

import Button from "@material-ui/core/Button";
import Header from "./Header";

import client from "../mqtt";

const Container = styled.div``;
const Broker = styled.section``;
const Webserver = styled.section`
  margin-top: 50px;
`;
const Views = styled.section``;

const Ciao = styled.h1``;
const Arrivederci = styled.h2`
  text-align: right;
`;

export default () => {
  const config = useSelector(state => state.system.config);
  useEffect(() => {
    client.publish("ragazzi/project/config/get", "");
  });
  return (
    <Container>
      <Header></Header>
      <h1>ciao ragazzi</h1>
      <Broker>
        <p>
          a mqtt broker is up and running at {config.ip}, it communicates on
          ports 9001 (ws) and 1883 (tcp).
        </p>
        <p>
          for monitoring and debugging, the{" "}
          <Link to="/dev">mqtt dev tools</Link> might be useful.
        </p>
      </Broker>
      <Webserver>
        {(!config || !config.views || config.views.length === 0) && (
          <>
            <p>wanna host a project?</p>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              type="button"
              onClick={event => {
                client.publish("ragazzi/project/open/choose", "");
              }}
            >
              open
            </Button>
          </>
        )}
        {config &&
          Object.entries(config).length > 0 &&
          config.views &&
          (config.views.length > 0 || config.externalViews.length > 0) && (
            <Views>
              the following views are available:
              <ul>
                {config.views &&
                  config.views.map(view => {
                    return (
                      <li>
                        <a
                          href={`http://${config.ip}:${config.internalHttpPort}/${view.path}`}
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
                          href={`http://${config.ip}:${config.internalHttpPort}/${view.path}`}
                          target="_blank"
                        >
                          {view.title}
                        </a>
                      </li>
                    );
                  })}
              </ul>
              <p>
                on external devices please navigate to {`http://${config.ip}`}{" "}
                and select the corresponding view.
              </p>
            </Views>
          )}
      </Webserver>
      <Arrivederci>arrivederci a presto, baciotti!!!</Arrivederci>
    </Container>
  );
};
