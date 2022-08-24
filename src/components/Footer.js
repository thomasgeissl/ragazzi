import React from "react";
import { Link, useLocation } from "react-router-dom";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";

import styled from "@emotion/styled";
import { useSelector } from "react-redux";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const Container = styled.footer`
  /* position: fixed;
bottom: 0; */
  width: 100%;
`;

const Left = styled(Grid)`
  background-color: #009246;
  padding-left: 8px;
  a {
    color: white;
  }
  min-height: 16px;
`;
const Center = styled(Grid)`
  background-color: #ffffff;
`;
const Right = styled(Grid)`
  background-color: #ce2b37;
  color: white;
  text-align: right;
  padding-right: 8px;
`;

export default () => {
  const version = useSelector((state) => state.system.version);
  const location = useLocation();

  return (
    <Container>
      <Grid container>
        <Grid
          item
          xs={12}
          container
          alignItems="flex-end"
          justify="space-between"
          direction="row"
          spacing={1}
        >
          <Grid item>
            <Typography variant="caption" color="textSecondary"></Typography>
          </Grid>
          <Grid item>
            <Typography variant="caption" color="textSecondary">
              <i>arrivederci a presto, baciotti.</i>
            </Typography>
          </Grid>
        </Grid>
        <Left item xs={4}>
          {location.pathname !== "/" && <Link to="/">back</Link>}
        </Left>
        <Center item xs={4}></Center>
        <Right item xs={4}>
          v{version}
        </Right>
      </Grid>
    </Container>
  );
};
