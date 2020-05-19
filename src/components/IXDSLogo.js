import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import Logo from "../assets/IXDS-PWC-Logo.svg";

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
  return <img className={classes.logo} src={Logo} alt="logo"></img>;
};
