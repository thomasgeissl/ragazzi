import React from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
// import styled from "styled-components";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";

// const Container = styled.div`
//   padding-top: 15px;
//   padding-bottom: 15px;
//   display: flex;
// `;

// const Version = styled.span`
//   flex-grow: 1;
//   text-align: right;
// `;
export default () => {
  const version = useSelector((state) => state.system.version);
  const location = useLocation();
  return (
    <Box>
      <Grid
        container
        direction="row"
        justify="space-between"
        alignItems="center"
      >
        <Grid item>
          {location.pathname !== "/" && (
            <Link to="/">
              <Typography>
                <ArrowBackIcon></ArrowBackIcon>
              </Typography>
            </Link>
          )}
        </Grid>
        <Grid item>
          <Typography variant="caption">
            <Box color="text.secondary">v {version}</Box>
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
};
