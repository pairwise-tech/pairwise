import { History } from "history";
import { combineReducers } from "redux";
import { combineEpics, Epic } from "redux-observable";

/** ===========================================================================
 * Import Redux Modules
 * ============================================================================
 */

import App, { AppActionTypes, AppState } from "./app";
import Challenges, {
  ChallengesActionTypes,
  ChallengesState,
} from "./challenges";

/** ===========================================================================
 * Root Actions and Selectors
 * ============================================================================
 */

export type ReduxActionTypes = AppActionTypes | ChallengesActionTypes;

export const selectors = {
  app: App.selector,
  challenges: Challenges.selector,
};

export const actions = {
  app: App.actions,
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
  challenges: ChallengesState;
}

const rootReducer = combineReducers({
  app: App.store,
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
