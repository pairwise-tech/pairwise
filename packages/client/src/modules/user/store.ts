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
 * App Store
 * ============================================================================
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
