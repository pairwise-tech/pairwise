import { createReducer } from "typesafe-actions";
import { AuthActionTypes } from "../auth";
import { Actions as actions } from "../root-actions";
import { UsersActionTypes } from "./index";
import { combineReducers } from "redux";
import {
  AdminProgressChartDto,
  Payment,
  UserCourseProgress,
  UserSettings,
} from "@pairwise/common";

/** ===========================================================================
 * Users Store
 * ============================================================================
 */

export interface State {
  users: AdminUserView[];
  loading: boolean;
  allUserProgress: AdminProgressChartDto;
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
  coachingSessions: number;
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
  .handleAction(actions.markCoachingSessionCompleteSuccess, (state, action) => {
    return state.map((user) => {
      if (user.uuid === action.payload.userUuid) {
        return {
          ...user,
          coachingSessions: user.coachingSessions - 1,
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

const allUserProgress = createReducer<AdminProgressChartDto, UsersActionTypes>(
  [],
).handleAction(
  actions.fetchAllUsersProgressSuccess,
  (state, action) => action.payload,
);

const rootReducer = combineReducers({
  users,
  loading,
  allUserProgress,
});

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default rootReducer;
