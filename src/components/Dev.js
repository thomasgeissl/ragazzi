import React from "react";
import styled from "styled-components";

import Header from "./Header";
import Status from "./Status";
import Publisher from "./Publisher";
import Subscriber from "./Subscriber";

const Container = styled.div``;
export default () => {
  return (
    <Container>
      <Header></Header>
      <Status></Status>
      <Publisher></Publisher>
      <Subscriber></Subscriber>
    </Container>
  );
};
