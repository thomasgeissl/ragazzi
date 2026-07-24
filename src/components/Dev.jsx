import React from "react";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Broker from "./Broker";
import Publisher from "./Publisher";
import Logger from "./Logger";

export default () => {
  return (
    <Container sx={{ mt: 0, pt: "20px" }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Box sx={{ width: "100%" }}>
          <Broker />
        </Box>
        <Box sx={{ width: "100%" }}>
          <Publisher />
        </Box>
        <Box sx={{ width: "100%" }}>
          <Logger />
        </Box>
      </Box>
    </Container>
  );
};
