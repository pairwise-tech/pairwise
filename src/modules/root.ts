import { History } from "history";
import { combineReducers } from "redux";
import { combineEpics, Epic } from "redux-observable";

/** ===========================================================================
 * Import Redux Modules
 * ============================================================================
 */

import App, { AppActionTypes, AppState } from "./app";

/** ===========================================================================
 * Root Actions and Selectors
 * ============================================================================
 */

export type ReduxActionTypes = AppActionTypes;

export const selectors = {
  app: App.selector,
};

export const actions = {
  app: App.actions,
};

const Modules = {
  selectors,
  actions,
};

/** ===========================================================================
 * Root Reducer
 * ============================================================================
 */

export interface ReduxStoreState {
  app: AppState;
}

const rootReducer = combineReducers({
  app: App.store,
});

/** ===========================================================================
 * Root Epic
 * ============================================================================
 */

export interface EpicDependencies {
  router: History<any>;
}

export type EpicSignature = Epic<
  ReduxActionTypes,
  ReduxActionTypes,
  ReduxStoreState,
  EpicDependencies
>;

const rootEpic = combineEpics(App.epics);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export { rootEpic, rootReducer };

export default Modules;
