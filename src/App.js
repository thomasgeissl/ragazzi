import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Provider } from "react-redux";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

import Home from "./components/Home";
import Dev from "./components/Dev";
import Footer from "./components/Footer";

import { makeStyles } from '@material-ui/core/styles';
import { createMuiTheme } from '@material-ui/core/styles';
import { ThemeProvider } from '@material-ui/core/styles'
import { green, orange } from '@material-ui/core/colors';

import Grid from '@material-ui/core/Grid';

import store from "./store";
import mqtt from "mqtt";

const client = mqtt.connect("ws://localhost:9001");

client.subscribe("ragazzi");
client.on("message", (topic, message) => {
  if (topic === "ragazzi") {
    const action = JSON.parse(message.toString());
    store.dispatch(action);
  }
});

const theme = createMuiTheme({
  palette: {
    primary: {
      main: '#CE2B37'
    },
    secondary: {
      main: '#ffffff'
    },
    success: {
      main: '#009246'
    }
  }
});

const useStyles = makeStyles({
  app: {
    width: '100vw',
    height: '100vh',
    padding: '0px',
    margin: '0px',
    outline: 'none',
    backgroundColor: '#eeeeee'
  },
  dropzone: {
    width: '100vw',
    height: '100vh',
    outline: 'none',
    padding: '0px',
    margin: '0px'
  }
});

function App() {
  const onDrop = useCallback((acceptedFiles) => {
    const regex = /(?:\.([^.]+))?$/;
    const ext = regex.exec(acceptedFiles[0].path);

    if (ext.includes("html")) {
      client.publish("ragazzi/webapp/open", acceptedFiles[0].path);
      console.log("open html");
    }
    if (ext.includes("json") || ext.includes("ragazzi")) {
      client.publish("ragazzi/project/open", acceptedFiles[0].path);
    }
  }, []);
  const { getRootProps } = useDropzone({ onDrop });
  const classes = useStyles();
  
  return (
    <ThemeProvider theme={theme}>
        <Grid className={classes.app} container direction="column" justify="space-between" alignItems="center">
          <Grid item className={green.dropzone} {...getRootProps()}>
              <Provider store={store}>
                <Router>
                  <Switch>
                    <Route path="/dev">
                      <Dev />
                    </Route>
                    <Route path="/">
                      <Home />
                    </Route>
                  </Switch>
                </Router>
              </Provider>
            </Grid>
            <Footer item></Footer>
          </Grid>
    </ThemeProvider>

  );
}

export default App;
