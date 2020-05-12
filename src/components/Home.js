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

import client from "../mqtt";

const useStyles = makeStyles({
  h1: 
  {
    color: '#ff0000'
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
        <Typography variant="h1" className={classes.h1}><i>ciao ragazzi.</i></Typography>
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
              <Grid container spacing={1}>
                 <Grid item><Box color="success.main"><CheckIcon></CheckIcon></Box></Grid>
                 <Grid item><Typography><Box color="success.main">project is hosted</Box></Typography></Grid>
             </Grid>
             </CardContent>     
             </Card>
             </Grid> 
            <Grid item xs={6}>
          <Card>
            <CardContent>
            <Typography color="textSecondary" gutterBottom>Views</Typography>
            <Typography variant="body1">
              <ul>
                {config.views &&
                  config.views.map((view, index) => {
                    return (
                      <li key={index}>
                        <Link
                          href={`http://${config.ip}:${config.internalHttpPort}/${view.path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {view.title}
                        </Link>
                      </li>
                    );
                  })}
                {config &&
                  Object.entries(config).length !== 0 &&
                  config.externalViews &&
                  config.externalViews.map((view, index) => {
                    return (
                      <li key={index}>
                        <Link
                          href={`http://${config.ip}:${config.internalHttpPort}/${view.path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {view.title}
                        </Link>
                      </li>
                    );
                  })}
              </ul>
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
     
        {/* <Grid item xs={12} container direction="row" justify="flex-end" alignItems="center">
          <Grid item>
            <Typography variant="h5"><i>arrivederci a presto, baciotti.</i></Typography>
          </Grid>
        </Grid>      */}

      </Grid>
    </Container>
  );
};
