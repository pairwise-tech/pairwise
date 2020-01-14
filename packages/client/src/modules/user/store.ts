import { createReducer } from "typesafe-actions";

import {
  UserSettings,
  Payment,
  UserCourseAccessMap,
  UserProgressMap,
  UserProfile,
} from "@pairwise/common";
import { AppActionTypes } from "../app";
import { Actions as actions } from "../root-actions";
import { ActionTypes } from "./actions";

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
export interface State {
  profile: Nullable<UserProfile>;
  payments: Nullable<Payment[]>;
  settings: Nullable<UserSettings>;
  courses: Nullable<UserCourseAccessMap>;
  progress: Nullable<UserProgressMap>;
}

export type UserStoreState = State;

const initialState = {
  profile: null,
  payments: null,
  settings: null,
  courses: null,
  progress: null,
};

const app = createReducer<State, ActionTypes | AppActionTypes>(initialState)
  .handleAction(actions.logoutUser, () => initialState)
  .handleAction(
    [actions.fetchUserSuccess, actions.updateUserSuccess],
    (state, action) => ({
      ...state,
      ...action.payload,
    }),
  );

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default app;
