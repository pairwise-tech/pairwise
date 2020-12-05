import { createBrowserHistory } from "history";
import { applyMiddleware, createStore, Middleware } from "redux";
import { composeWithDevTools } from "redux-devtools-extension";
import { createEpicMiddleware } from "redux-observable";

import * as ENV from "../tools/admin-env";
import api from "./api";
import {
  EpicDependencies,
  Modules,
  selectors,
  rootEpic,
  rootReducer,
} from "./root";
import toaster from "tools/toast-utils";
import logger from "tools/logger";
import * as Storage from "tools/storage-utils";

/** ===========================================================================
 * Router History
 * ============================================================================
 */

const history = createBrowserHistory();

/** ===========================================================================
 * Setup middleware and configure store
 * ============================================================================
 */

const dependencies: EpicDependencies = {
  api,
  toaster,
  selectors,
  router: history,
  storage: Storage,
};

const epicMiddleware = createEpicMiddleware({
  dependencies,
});

let middleware: ReadonlyArray<Middleware> = [epicMiddleware];

if (ENV.DEVELOPMENT) {
  middleware = middleware.concat(logger);
}

const configureStore = () => {
  const reduxStore = createStore(
    rootReducer,
    composeWithDevTools(applyMiddleware(...middleware)),
  );

  // @ts-ignore
  epicMiddleware.run(rootEpic);

  return reduxStore;
};

/** ===========================================================================
 * Create Store
 * ============================================================================
 */

const store = configureStore();

/** ===========================================================================
 * Export
 * ============================================================================
 */

/**
 * Meant for dev mode, to manually dispatch actions via the browser console.
 */
export const exposeGlobals = () => {
  // @ts-ignore
  window.Modules = Modules;
  // @ts-ignore
  window.getState = store.getState;
  // @ts-ignore
  window.dispatch = store.dispatch;
};

export { history };

export default store;
