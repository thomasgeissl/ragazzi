import { createStore, applyMiddleware, compose } from "redux";
// import { createEpicMiddleware } from "redux-observable";

import rootReducer from "./reducers/rootReducer";
// import rootEpic from './epics/rootEpic'

// const epicMiddleware = createEpicMiddleware()
const composeEnhancer = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const store = createStore(
  rootReducer,
  composeEnhancer(
    applyMiddleware()
    // epicMiddleware
  )
);

// epicMiddleware.run(rootEpic);
// store.subscribe(() => console.log(store.getState()))
store.dispatch({
  type: "INIT",
});

export default store;
