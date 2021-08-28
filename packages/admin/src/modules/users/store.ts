import { createReducer } from "typesafe-actions";
import { AuthActionTypes } from "../auth";
import { Actions as actions } from "../root-actions";
import { UsersActionTypes } from "./index";
import { combineReducers } from "redux";
import { Payment, UserCourseProgress, UserSettings } from "@pairwise/common";

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
  createdAt: string;
  displayName: string;
  email: string;
  facebookAccountId: Nullable<string>;
  familyName: string;
  githubAccountId: Nullable<string>;
  givenName: string;
  googleAccountId: Nullable<string>;
  lastActiveChallengeIds: any;
  hasCoachingSession: Nullable<boolean>;
  payments: Payment[];
  settings: UserSettings;
  challengeProgressHistory: UserCourseProgress;
  updatedAt: string;
  uuid: string;
}

const users = createReducer<
  AdminUserView[],
  UsersActionTypes | AuthActionTypes
>([])
  .handleAction(actions.fetchUsersSuccess, (state, action) => action.payload)
  .handleAction(actions.revokeCoachingSessionSuccess, (state, action) => {
    return state.map((user) => {
      if (user.uuid === action.payload.userUuid) {
        return {
          ...user,
          hasCoachingSession: false,
        };
      } else {
        return user;
      }
    });
  });

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
