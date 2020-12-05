import { createReducer } from "typesafe-actions";
import { AuthActionTypes } from "../auth";
import { Actions as actions } from "../root-actions";
import { UsersActionTypes } from "./index";
import { combineReducers } from "redux";
import { Payment, UserSettings } from "@pairwise/common";

/** ===========================================================================
 * Users Store
 * ============================================================================
 */

export interface State {
  users: AdminUserView[];
  loading: boolean;
}

export interface AdminUserView {
  avatarUrl: string;
  challengeProgressHistory: any;
  createdAt: string;
  displayName: string;
  email: string;
  facebookAccountId: Nullable<string>;
  familyName: string;
  githubAccountId: Nullable<string>;
  givenName: string;
  googleAccountId: Nullable<string>;
  lastActiveChallengeIds: any;
  payments: Payment[];
  settings: UserSettings;
  updatedAt: string;
  uuid: string;
}

const users = createReducer<any[], UsersActionTypes | AuthActionTypes>(
  [],
).handleAction(actions.fetchUsersSuccess, (state, action) => action.payload);

const loading = createReducer<boolean, UsersActionTypes | AuthActionTypes>(
  true,
).handleAction(
  [actions.fetchUsersSuccess, actions.fetchUsersFailure],
  () => false,
);

const rootReducer = combineReducers({
  users,
  loading,
});

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default rootReducer;
