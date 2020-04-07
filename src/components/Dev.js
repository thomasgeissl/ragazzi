import React from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import styled from "styled-components";

import Status from "./Status";
import Publisher from "./Publisher";
import Subscriber from "./Subscriber";

import HomeIcon from "@material-ui/icons/Home";

const Container = styled.div``;
export default () => {
  const config = useSelector(state => state.system.config);
  return (
    <Container>
      <Link to="/">
        <HomeIcon></HomeIcon>
      </Link>
      <Status></Status>
      <Publisher></Publisher>
      <Subscriber></Subscriber>
    </Container>
  );
};
