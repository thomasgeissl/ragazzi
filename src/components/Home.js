import React from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import styled from "styled-components";

const Container = styled.div``;

export default () => {
  const config = useSelector(state => state.system.config);
  return (
    <Container>
      <h1>home</h1>
      <Link to="/dev">mqtt dev tools</Link>
    </Container>
  );
};
