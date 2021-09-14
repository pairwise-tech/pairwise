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

const mockDispatchFn = () => {
  console.warn(
    "[WARNING]: Dispatch function not assigned to epic middleware yet!",
  );
};

const dependencies: EpicDependencies = {
  api,
  toaster,
  selectors,
  socket: null,
  router: history,
  storage: Storage,
  dispatch: mockDispatchFn,
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

  // eslint-disable-next-line
  // @ts-ignore
  epicMiddleware.run(rootEpic);

  return reduxStore;
};

/** ===========================================================================
 * Create Store
 * ============================================================================
 */

const store = configureStore();

// Assign dispatch function to epic dependencies
dependencies.dispatch = store.dispatch;

/** ===========================================================================
 * Export
 * ============================================================================
 */

/**
 * Meant for dev mode, to manually dispatch actions via the browser console.
 */
export const exposeGlobals = () => {
  // eslint-disable-next-line
  // @ts-ignore
  window.Modules = Modules;
  // eslint-disable-next-line
  // @ts-ignore
  window.getState = store.getState;
  // eslint-disable-next-line
  // @ts-ignore
  window.dispatch = store.dispatch;
};

export { history };

export default store;
