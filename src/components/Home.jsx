import React, { useEffect } from "react";
import { useSelector } from "react-redux";

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

export default () => {
  const config = useSelector((state) => state.system.config);
  useEffect(() => {
    client.publish("ragazzi/project/config/get", "");
  });

  return (
    <Container>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: "20px" }}>
        <Typography variant="h2" color="primary">
          <i>ciao ragazzi.</i>
        </Typography>

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

        {(!config || !config.views || config.views.length === 0) && (
          <Box>
            <Button
              variant="contained"
              color="primary"
              type="button"
              onClick={() => {
                client.publish("ragazzi/project/open/choose", "");
              }}
            >
              open project
            </Button>
          </Box>
        )}

        {config &&
          Object.entries(config).length > 0 &&
          config.views &&
          (config.views.length > 0 || config.externalViews.length > 0) && (
            <Grid container spacing={2}>
              <Grid size={6}>
                <Card>
                  <CardContent>
                    <Grid container spacing={1} sx={{ maxHeight: "24px" }}>
                      <Grid>
                        <Box sx={{ color: "success.main" }}>
                          <CheckIcon />
                        </Box>
                      </Grid>
                      <Grid>
                        <Typography sx={{ color: "success.main" }}>
                          project is hosted
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={6}>
                <Card>
                  <CardContent>
                    <Typography color="text.primary" gutterBottom>
                      <b>Views</b>
                    </Typography>
                    <Typography variant="body1" component="div">
                      <List>
                        {config.views &&
                          config.views.map((view, index) => {
                            return (
                              <ListItem key={index}>
                                <ListItemIcon sx={{ minWidth: "36px" }}>
                                  <DesktopWindowsIcon />
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
                                <ListItemIcon sx={{ minWidth: "36px" }}>
                                  <PhoneAndroidIcon />
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
            </Grid>
          )}
      </Box>
    </Container>
  );
};
