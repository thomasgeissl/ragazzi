import React from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import Link from "@material-ui/core/Link";
// import styled from "styled-components";
import ArrowBackIcon from "@material-ui/icons/ArrowBack";
import Box from "@material-ui/core/Box";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";

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
            <Link href="/">
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
