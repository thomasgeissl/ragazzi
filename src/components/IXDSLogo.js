import React from "react";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles({
  logo: {
    width: "64px",
    marginLeft: "24px",
    marginBottom: "8px",
    opacity: "1",
  },
});

export default () => {
  const classes = useStyles();
  return (
    <img className={classes.logo} src="../IXDS-PWC-Logo.svg" alt="logo"></img>
  );
};
