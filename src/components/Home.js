import React, { useEffect } from "react";
import { useSelector } from "react-redux";

import { makeStyles } from "@mui/styles";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import { Link } from "react-router-dom";
import Grid from "@mui/material/Grid";
import CheckIcon from "@mui/icons-material/Check";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import DesktopWindowsIcon from "@mui/icons-material/DesktopWindows";
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";

import client from "../mqtt";

const useStyles = makeStyles({
  h1: {
    marginTop: "20px",
  },
  status: {
    maxHeight: "24px",
  },
  icon: {
    minWidth: "36px",
  },
});

export default () => {
  const config = useSelector((state) => state.system.config);
  useEffect(() => {
    client.publish("ragazzi/project/config/get", "");
  });

  const classes = useStyles();

  return (
    <Container>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="h2" color="primary" className={classes.h1}>
            <i>ciao ragazzi.</i>
          </Typography>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="caption">
                Your friendly mqtt broker is up and running at{" "}
                <b>{config.ip}</b>.<br />
                It communicates on ports <b>9001</b> (ws) and <b>1883</b> (tcp).
                <br />
                For monitoring and debugging, the{" "}
                <Link to="/dev">mqtt dev tools</Link> might be useful.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {(!config || !config.views || config.views.length === 0) && (
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              type="button"
              onClick={(event) => {
                client.publish("ragazzi/project/open/choose", "");
              }}
            >
              open project
            </Button>
          </Grid>
        )}

        {config &&
          Object.entries(config).length > 0 &&
          config.views &&
          (config.views.length > 0 || config.externalViews.length > 0) && (
            <>
              <Grid item xs={6}>
                <Card>
                  <CardContent>
                    <Grid container spacing={1} className={classes.status}>
                      <Grid item>
                        <Box color="success.main">
                          <CheckIcon></CheckIcon>
                        </Box>
                      </Grid>
                      <Grid item>
                        <Typography>
                          <Box color="success.main">project is hosted</Box>
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card>
                  <CardContent>
                    <Typography color="textPrimary" gutterBottom>
                      <b>Views</b>
                    </Typography>
                    <Typography variant="body1">
                      <List>
                        {config.views &&
                          config.views.map((view, index) => {
                            return (
                              <ListItem key={index}>
                                <ListItemIcon className={classes.icon}>
                                  <DesktopWindowsIcon></DesktopWindowsIcon>
                                </ListItemIcon>
                                <a
                                  href={`http://${config.ip}:${config.internalHttpPort}/${view.path}?broker=${config.ip}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {view.title}
                                </a>
                              </ListItem>
                            );
                          })}
                        {config &&
                          Object.entries(config).length !== 0 &&
                          config.externalViews &&
                          config.externalViews.map((view, index) => {
                            return (
                              <ListItem key={index}>
                                <ListItemIcon className={classes.icon}>
                                  <PhoneAndroidIcon></PhoneAndroidIcon>
                                </ListItemIcon>
                                <a
                                  href={`http://${config.ip}:${config.internalHttpPort}/${view.path}?broker=${config.ip}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {view.title}
                                </a>
                              </ListItem>
                            );
                          })}
                      </List>
                      <Typography variant="caption">
                        On external devices navigate to
                        <b>
                          {" "}
                          {`http://${config.ip}${
                            config.externalHttpPort !== 80
                              ? ":" + config.externalHttpPort
                              : ""
                          }`}{" "}
                        </b>
                        and select the corresponding view.
                      </Typography>
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </>
          )}
      </Grid>
    </Container>
  );
};
