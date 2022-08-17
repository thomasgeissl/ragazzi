import React from "react";
import { makeStyles } from "@mui/styles";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";

import styled from "styled-components";
import { useSelector } from "react-redux";

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
    color: "white",
    textAlign: "right",
    paddingRight: "8px",
  },
});

export default () => {
  const version = useSelector((state) => state.system.version);
  const classes = useStyles();

  const Container = styled.footer`
    /* position: fixed;
  bottom: 0; */
    width: 100%;
  `;
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
        <Grid item xs={4} className={classes.green}></Grid>
        <Grid item xs={4} className={classes.white}></Grid>
        <Grid item xs={4} className={classes.red}>
          v{version}
        </Grid>
      </Grid>
    </Container>
  );
};
