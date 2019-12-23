import { History } from "history";
import { combineReducers } from "redux";
import { combineEpics, Epic } from "redux-observable";

/** ===========================================================================
 * Import Redux Modules
 * ============================================================================
 */

import App, { AppActionTypes, AppState } from "./app";
import Auth, { AuthActionTypes, AuthState } from "./auth";
import Challenges, {
  ChallengesActionTypes,
  ChallengesState,
} from "./challenges";

/** ===========================================================================
 * Root Actions and Selectors
 * ============================================================================
 */

export type ReduxActionTypes =
  | AppActionTypes
  | ChallengesActionTypes
  | AuthActionTypes;

export const selectors = {
  app: App.selector,
  auth: Auth.selector,
  challenges: Challenges.selector,
};

export const actions = {
  app: App.actions,
  auth: Auth.actions,
  challenges: Challenges.actions,
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
  auth: AuthState;
  challenges: ChallengesState;
}

const rootReducer = combineReducers({
  app: App.store,
  auth: Auth.store,
  challenges: Challenges.store,
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

const rootEpic = combineEpics(App.epics, Challenges.epics);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export { rootEpic, rootReducer };

export default Modules;
