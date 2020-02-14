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
import Purchase, { PurchaseActionTypes, PurchaseState } from "./payments";
import Challenges, {
  ChallengesActionTypes,
  ChallengesState,
} from "./challenges";
import User, { UserActionTypes, UserState } from "./user";
import { catchError } from "rxjs/operators";
import Feedback, { FeedbackActionTypes, FeedbackState } from "./feedback";
import { toaster } from "tools/constants";

/** ===========================================================================
 * Root Actions and Selectors
 * ============================================================================
 */

export type ReduxActionTypes =
  | AppActionTypes
  | ChallengesActionTypes
  | UserActionTypes
  | AuthActionTypes
  | PurchaseActionTypes
  | FeedbackActionTypes;

export const selectors = {
  app: App.selector,
  auth: Auth.selector,
  user: User.selector,
  challenges: Challenges.selector,
  purchase: Purchase.selector,
  feedback: Feedback.selector,
};

export const actions = {
  app: App.actions,
  auth: Auth.actions,
  user: User.actions,
  challenges: Challenges.actions,
  purchase: Purchase.actions,
  feedback: Feedback.actions,
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
  feedback: FeedbackState;
}

const rootReducer = combineReducers({
  app: App.store,
  auth: Auth.store,
  user: User.store,
  challenges: Challenges.store,
  purchase: Purchase.store,
  feedback: Feedback.store,
});

/** ===========================================================================
 * Root Epic
 * ============================================================================
 */

export interface EpicDependencies {
  router: History<any>;
  api: typeof API;
  toaster: typeof toaster;
  selectors: typeof selectors;
}

export type EpicSignature = Epic<
  ReduxActionTypes,
  ReduxActionTypes,
  ReduxStoreState,
  EpicDependencies
>;

const combinedEpic = combineEpics(
  App.epics,
  User.epics,
  Auth.epics,
  Challenges.epics,
  Purchase.epics,
  Feedback.epics,
);

const handleRootEpicError = (error: any, source: any) => {
  // Handle error side effects, e.g. report error
  return source;
};

/**
 * See "Adding global error handler" section of:
 * https://redux-observable.js.org/docs/basics/SettingUpTheMiddleware.html
 *
 * If there is an uncaught error, resubscribe the stream so it does not
 * collapse.
 */
const rootEpic = (action$: any, store$: any, dependencies: any) => {
  return combinedEpic(action$, store$, dependencies).pipe(
    catchError(handleRootEpicError),
  );
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export { rootEpic, rootReducer };

export default Modules;
