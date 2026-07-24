import React from "react";
import { Link } from "react-router-dom";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Broker from "./Broker";
import Publisher from "./Publisher";
import Logger from "./Logger";

export default function Dev() {
  return (
    <Container sx={{ mt: 0, pt: "20px" }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Box>
          <Button
            component={Link}
            to="/"
            startIcon={<ArrowBackIcon />}
            color="primary"
          >
            back
          </Button>
        </Box>
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
}
