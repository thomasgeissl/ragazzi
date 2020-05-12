import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Provider } from "react-redux";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

import Home from "./components/Home";
import Dev from "./components/Dev";

import { makeStyles } from '@material-ui/core/styles';
import { createMuiTheme } from '@material-ui/core/styles';
import { ThemeProvider } from '@material-ui/core/styles'
import { green, orange } from '@material-ui/core/colors';

import Box from '@material-ui/core/Box';

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
      main: '#ff0000'
    },
    secondary: {
      main: '#ffffff'
    },
    success: {
      main: '#00ff00'
    }
  }
});

const useStyles = makeStyles({
  app: {
    width: '100vw',
    height: '100vw',
    padding: '0px',
    margin: '0px',
    outline: 'none',
    backgroundColor: '#eeeeee'
  },
  dropzone: {
    width: '100vw',
    height: '100vw',
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
      <Box className={classes.app}>
        <Box className={green.dropzone} {...getRootProps()}>
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
          </Box>
        </Box>
    </ThemeProvider>

  );
}

export default App;
