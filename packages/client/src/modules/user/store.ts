import { createReducer } from "typesafe-actions";
import {
  UserSettings,
  Payment,
  UserCourseAccessMap,
  UserProgressMap,
  UserProfile,
  defaultUserSettings,
  ChallengeStatus,
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
  .handleAction(actions.disconnectAccountSuccess, (state, action) => {
    return {
      ...state,
      profile: action.payload.profile,
    };
  })
  .handleAction(
    actions.updateLastActiveChallengeIdsSuccess,
    (state, action) => {
      return {
        ...state,
        lastActiveChallengeIds: action.payload,
      };
    },
  )
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
  )
  // when user progress is updated successfully, immediately update
  // user state to reflect user's progress in challenge map right away
  .handleAction(actions.updateUserProgressSuccess, (state, action) => {
    const status: ChallengeStatus = {
      complete: action.payload.complete,
      timeCompleted: action.payload.timeCompleted,
    };

    if (state.progress) {
      return {
        ...state,
        progress: {
          ...state.progress,
          [action.payload.courseId]: {
            ...state.progress[action.payload.courseId],
            [action.payload.challengeId]: status,
          },
        },
      };
    }

    return {
      ...state,
      progress: {
        [action.payload.courseId]: {
          [action.payload.challengeId]: status,
        },
      },
    };
  });

const loading = createReducer<boolean, UserActionTypes | AuthActionTypes>(
  true,
).handleAction(actions.fetchUserSuccess, () => false);

const emailVerificationStatus = createReducer<
  EMAIL_VERIFICATION_STATUS,
  UserActionTypes
>(EMAIL_VERIFICATION_STATUS.DEFAULT)
  .handleAction(
    actions.setEmailVerificationStatus,
    (state, action) => action.payload,
  )
  .handleAction(
    actions.updateUserEmail,
    () => EMAIL_VERIFICATION_STATUS.LOADING,
  )
  .handleAction(
    actions.updateUserEmailSuccess,
    () => EMAIL_VERIFICATION_STATUS.SENT,
  )
  .handleAction(
    actions.updateUserEmailFailure,
    () => EMAIL_VERIFICATION_STATUS.ERROR,
  );

const rootReducer = combineReducers({
  user,
  loading,
  emailVerificationStatus,
});

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default rootReducer;
