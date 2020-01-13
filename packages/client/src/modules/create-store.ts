import { createBrowserHistory } from "history";
import { applyMiddleware, createStore, Middleware } from "redux";
import { composeWithDevTools } from "redux-devtools-extension";
import { createLogger } from "redux-logger";
import { createEpicMiddleware } from "redux-observable";

import * as ENV from "../tools/client-env";
import api from "./api";
import { EpicDependencies, Modules, rootEpic, rootReducer } from "./root";
import { AppToaster } from "tools/constants";

/** ===========================================================================
 * Logger
 * ============================================================================
 */

const TITLE = "#15B06D";
const ACTION = "#ff6647";
const NEXT_STATE = "#50adfa";

const logger = createLogger({
  collapsed: true,
  duration: true,
  level: {
    prevState: false,
    action: "info",
    nextState: "info",
  },
  colors: {
    title: () => TITLE,
    action: () => ACTION,
    nextState: () => NEXT_STATE,
  },
});

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
  router: history,
  toaster: AppToaster,
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
 * Meant for dev mode, to manually dispatch actions via the CLI
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
