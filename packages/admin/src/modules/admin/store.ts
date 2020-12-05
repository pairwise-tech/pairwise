import { createReducer } from "typesafe-actions";
import {
  UserSettings,
  Payment,
  UserCourseAccessMap,
  UserProgressMap,
  UserProfile,
  defaultUserSettings,
  LastActiveChallengeIds,
} from "@pairwise/common";
import { AuthActionTypes } from "../auth";
import { Actions as actions } from "../root-actions";
import { UserActionTypes } from "./index";
import { combineReducers } from "redux";
import { ChallengesActionTypes } from "modules/challenges";

/** ===========================================================================
 * User Store
 * ============================================================================
 */

/**
 * The user object stored in Redux is a modified version of the IUserDto
 * which returns from the server. The structure is the same, but all the
 * fields are nullable here, because:
 *
 * 1. The user may not have been fetched yet.
 * 2. The user may not have an account.
 *
 * The fields are all separated like this to allow a unified API where some
 * fields can be updated locally before a user signup occurs. This currently
 * happens with the progress and settings fields. All of this occurs in the
 * api.ts module and the rest of the client app can just treat this type
 * definition as the source of truth and behave accordingly.
 */
export interface UserState {
  profile: Nullable<UserProfile>;
  payments: Nullable<Payment[]>;
  settings: UserSettings;
  courses: Nullable<UserCourseAccessMap>;
  progress: Nullable<UserProgressMap>;
  lastActiveChallengeIds: LastActiveChallengeIds;
}

export type UserStoreState = UserState;

export enum EMAIL_VERIFICATION_STATUS {
  DEFAULT = "DEFAULT",
  LOADING = "LOADING",
  SENT = "SENT",
  ERROR = "ERROR",
}

const initialUserState = {
  profile: null,
  payments: null,
  courses: null,
  progress: {},
  lastActiveChallengeIds: {},
  settings: defaultUserSettings,
};

export interface State {
  user: UserState;
  loading: boolean;
  emailVerificationStatus: EMAIL_VERIFICATION_STATUS;
}

const user = createReducer<
  UserState,
  UserActionTypes | AuthActionTypes | ChallengesActionTypes
>(initialUserState)
  .handleAction(actions.logoutUser, () => initialUserState)
  .handleAction(
    [
      actions.fetchAdminUserSuccess,
    ],
    (state, action) => ({
      ...state,
      ...action.payload,
    }),
  );

const loading = createReducer<boolean, UserActionTypes | AuthActionTypes>(
  true,
).handleAction([actions.fetchAdminUserSuccess, actions.fetchAdminUserFailure, actions.adminUserLoginFailure], () => false);

const rootReducer = combineReducers({
  user,
  loading,
});

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default rootReducer;
