import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import IXDSLogo from "./IXDSLogo";

import styled from "styled-components";

const Container = styled.footer`
  position: fixed;
  bottom: 0;
  width: 100%;
`;

const useStyles = makeStyles({
  green: {
    backgroundColor: "#009246",
    minHeight: "16px",
  },
  white: {
    backgroundColor: "#ffffff",
  },
  red: {
    backgroundColor: "#CE2B37",
  },
});

export default () => {
  const classes = useStyles();
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
            <Typography variant="caption" color="textSecondary">
              <IXDSLogo></IXDSLogo>
            </Typography>
          </Grid>
          <Grid item>
            <Typography variant="caption" color="textSecondary">
              <i>arrivederci a presto, baciotti.</i>
            </Typography>
          </Grid>
        </Grid>
        <Grid item xs={4} className={classes.green}></Grid>
        <Grid item xs={4} className={classes.white}></Grid>
        <Grid item xs={4} className={classes.red}></Grid>
      </Grid>
    </Container>
  );
};
