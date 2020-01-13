import { History } from "history";
import { combineReducers } from "redux";
import { combineEpics, Epic } from "redux-observable";

/** ===========================================================================
 * Import Redux Modules
 * ============================================================================
 */

import API from "./api";
import App, { AppActionTypes, AppState } from "./app";
import Auth, { AuthActionTypes, AuthState } from "./auth";
import Purchase, { PurchaseActionTypes, PurchaseState } from "./purchase";
import Challenges, {
  ChallengesActionTypes,
  ChallengesState,
} from "./challenges";
import User, { UserActionTypes, UserState } from "./user";
import { IToaster } from "@blueprintjs/core";

/** ===========================================================================
 * Root Actions and Selectors
 * ============================================================================
 */

export type ReduxActionTypes =
  | AppActionTypes
  | ChallengesActionTypes
  | UserActionTypes
  | AuthActionTypes
  | PurchaseActionTypes;

export const selectors = {
  app: App.selector,
  auth: Auth.selector,
  user: User.selector,
  challenges: Challenges.selector,
  purchase: Purchase.selector,
};

export const actions = {
  app: App.actions,
  auth: Auth.actions,
  user: User.actions,
  challenges: Challenges.actions,
  purchase: Purchase.actions,
};

export const Modules = {
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
  user: UserState;
  challenges: ChallengesState;
  purchase: PurchaseState;
}

const rootReducer = combineReducers({
  app: App.store,
  auth: Auth.store,
  user: User.store,
  challenges: Challenges.store,
  purchase: Purchase.store,
});

/** ===========================================================================
 * Root Epic
 * ============================================================================
 */

export interface EpicDependencies {
  router: History<any>;
  api: typeof API;
  toaster: IToaster;
}

export type EpicSignature = Epic<
  ReduxActionTypes,
  ReduxActionTypes,
  ReduxStoreState,
  EpicDependencies
>;

const rootEpic = combineEpics(
  App.epics,
  User.epics,
  Auth.epics,
  Challenges.epics,
  Purchase.epics,
);

/** ===========================================================================
 * Export
 * ============================================================================
 */

export { rootEpic, rootReducer };

export default Modules;
