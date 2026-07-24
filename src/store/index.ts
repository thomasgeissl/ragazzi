import { applyMiddleware, compose, createStore, type Store } from "redux";

import rootReducer, { type AppState } from "./reducers/rootReducer";

export type RootState = AppState;

const composeEnhancer = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const store: Store<RootState> = createStore(rootReducer, composeEnhancer(applyMiddleware()));

store.dispatch({
  type: "INIT",
});

export default store;
