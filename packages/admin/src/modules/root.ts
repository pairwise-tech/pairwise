import { History } from "history";
import { combineReducers } from "redux";
import { combineEpics, Epic } from "redux-observable";
import { catchError } from "rxjs/operators";
import API from "./api";
import toaster from "tools/toast-utils";

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
import User, { UserActionTypes, UserState } from "./admin";
import Users, { UsersActionTypes, UsersState } from "./users";
import Payments, { PaymentsActionTypes, PaymentsState } from "./payments";
import Feedback, { FeedbackActionTypes, FeedbackState } from "./feedback";
import Stats, { StatsActionTypes, StatsState } from "./stats";
import * as Storage from "../tools/storage-utils";

/** ===========================================================================
 * Root Actions and Selectors
 * ============================================================================
 */

export type ReduxActionTypes =
  | AppActionTypes
  | ChallengesActionTypes
  | UserActionTypes
  | UsersActionTypes
  | AuthActionTypes
  | PaymentsActionTypes
  | FeedbackActionTypes
  | StatsActionTypes;

export const selectors = {
  app: App.selector,
  auth: Auth.selector,
  admin: User.selector,
  users: Users.selector,
  stats: Stats.selector,
  feedback: Feedback.selector,
  payments: Payments.selector,
  challenges: Challenges.selector,
};

export const actions = {
  app: App.actions,
  auth: Auth.actions,
  admin: User.actions,
  users: Users.actions,
  feedback: Feedback.actions,
  stats: Stats.actions,
  payments: Payments.actions,
  challenges: Challenges.actions,
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
  admin: UserState;
  users: UsersState;
  stats: StatsState;
  feedback: FeedbackState;
  payments: PaymentsState;
  challenges: ChallengesState;
}

const rootReducer = combineReducers({
  app: App.store,
  auth: Auth.store,
  admin: User.store,
  users: Users.store,
  stats: Stats.store,
  feedback: Feedback.store,
  payments: Payments.store,
  challenges: Challenges.store,
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
  storage: typeof Storage;
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
  Users.epics,
  Auth.epics,
  Stats.epics,
  Feedback.epics,
  Payments.epics,
  Challenges.epics,
);

const handleRootEpicError = (error: any, source: any) => {
  // Handle error side effects, e.g. report error
  console.error("[ERROR] Uncaught error thrown from an epic: ", error);

  // Return original source stream
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
