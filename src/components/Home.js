import React, { useEffect } from "react";
import { useSelector } from "react-redux";

import { makeStyles } from '@material-ui/core/styles';
import Button from "@material-ui/core/Button";
import Box from '@material-ui/core/Box';
import Container from '@material-ui/core/Container';
import Typography from '@material-ui/core/Typography';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Link from '@material-ui/core/Link';
import Divider from '@material-ui/core/Divider';
import Grid from '@material-ui/core/Grid';
import CheckIcon from '@material-ui/icons/Check';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon'; 
import DesktopWindowsIcon from '@material-ui/icons/DesktopWindows';
import BuildIcon from '@material-ui/icons/Build';

import client from "../mqtt";

const useStyles = makeStyles({
  h1: 
  {
    marginTop: '20px'
  },
  status: {
    maxHeight: '24px'
  }
});

export default () => {
  const config = useSelector((state) => state.system.config);
  useEffect(() => {
    client.publish("ragazzi/project/config/get", "");
  });

  const classes = useStyles();
  
  return (
    <Container>

      <Grid container direction="colum" spacing={2}>

      <Grid item xs={12}>
        <Typography variant="h2" color="primary" className={classes.h1}><i>ciao ragazzi.</i></Typography>
      </Grid>

      <Grid item  xs={12}>
        <Card>
          <CardContent>
            <Typography variant="caption">
                Your friendly mqtt broker is up and running at <b>{config.ip}</b>.<br/> 
                It communicates on ports <b>9001</b> (ws) and <b>1883</b> (tcp).<br/>
                For monitoring and debugging, the{" "} <Link href="/dev">mqtt dev tools</Link> might be useful.
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
            <Card><CardContent>
            <Grid container spacing={1} className={classes.status}>
                 <Grid item><Box color="success.main"><CheckIcon></CheckIcon></Box></Grid>
                 <Grid item><Typography><Box color="success.main">project is hosted</Box></Typography></Grid>
             </Grid>
             </CardContent>     
             </Card>
             </Grid> 
            <Grid item xs={6}>
          <Card>
            <CardContent>
            <Typography color="textPrimary" gutterBottom><b>Views</b></Typography>
            <Typography variant="body1">
              <List>
                {config.views &&
                  config.views.map((view, index) => {
                    return (
                      <ListItem key={index}>
                        <ListItemIcon><DesktopWindowsIcon></DesktopWindowsIcon></ListItemIcon>
                        <Link
                          href={`http://${config.ip}:${config.internalHttpPort}/${view.path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {view.title}
                        </Link>
                      </ListItem>
                    );
                  })}
                {config &&
                  Object.entries(config).length !== 0 &&
                  config.externalViews &&
                  config.externalViews.map((view, index) => {
                    return (
                      <ListItem key={index}>
                        <ListItemIcon><DesktopWindowsIcon></DesktopWindowsIcon></ListItemIcon>
                         <Link
                          href={`http://${config.ip}:${config.internalHttpPort}/${view.path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {view.title}
                        </Link>
                      </ListItem>
                    );
                  })}
              </List>
              <Typography variant="caption">
                On external devices navigate to<b>{" "}
                {`http://${config.ip}${
                  config.externalHttpPort !== 80
                    ? ":" + config.externalHttpPort
                    : ""
                }`}{" "}</b>
                and select the corresponding view.
              </Typography>
            </Typography>
            </CardContent></Card>
          </Grid>
          </>
          )}
     
         

      </Grid>

    </Container>
  );
};
