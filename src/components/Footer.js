import React from "react";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";

import styled from "@emotion/styled";
import { useSelector } from "react-redux";

const Container = styled.footer`
  /* position: fixed;
bottom: 0; */
  width: 100%;
`;

const Left = styled(Grid)`
  background-color: #009246;
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
        <Left item xs={4}></Left>
        <Center item xs={4}></Center>
        <Right item xs={4}>
          v{version}
        </Right>
      </Grid>
    </Container>
  );
};
