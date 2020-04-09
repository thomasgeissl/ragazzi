import React from "react";
import { useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import styled from "styled-components";
import ArrowBackIcon from "@material-ui/icons/ArrowBack";

const Container = styled.div`
  padding-top: 15px;
  padding-bottom: 15px;
  display: flex;
`;

const Version = styled.span`
  flex-grow: 1;
  text-align: right;
`;
export default () => {
  const version = useSelector(state => state.system.version);
  const location = useLocation();
  return (
    <Container>
      {location.pathname !== "/" && (
        <Link to="/">
          <ArrowBackIcon></ArrowBackIcon>
        </Link>
      )}
      <Version>v{version}</Version>
    </Container>
  );
};
