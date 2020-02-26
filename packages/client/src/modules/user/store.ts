import { createReducer } from "typesafe-actions";
import {
  UserSettings,
  Payment,
  UserCourseAccessMap,
  UserProgressMap,
  UserProfile,
  defaultUserSettings,
} from "@pairwise/common";
import { AuthActionTypes } from "../auth";
import { Actions as actions } from "../root-actions";
import { UserActionTypes } from "./index";
import { combineReducers } from "redux";

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
}

export type UserStoreState = UserState;

const initialUserState = {
  profile: null,
  payments: null,
  settings: defaultUserSettings,
  courses: null,
  progress: null,
};

export interface State {
  loading: boolean;
  user: UserState;
}

const user = createReducer<UserState, UserActionTypes | AuthActionTypes>(
  initialUserState,
)
  .handleAction(actions.logoutUser, () => initialUserState)
  .handleAction(
    [
      actions.fetchUserSuccess,
      actions.updateUserSuccess,
      actions.updateUserSettingsSuccess,
    ],
    (state, action) => ({
      ...state,
      ...action.payload,
    }),
  );

const loading = createReducer<boolean, UserActionTypes | AuthActionTypes>(
  true,
).handleAction(actions.fetchUserSuccess, () => false);

const rootReducer = combineReducers({
  user,
  loading,
});

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default rootReducer;
