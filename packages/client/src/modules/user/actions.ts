import {
  IUserDto,
  UserUpdateOptions,
  UserSettings,
  SSO,
  UserProfile,
  UserLeaderboardDto,
  PublicUserProfile,
} from "@pairwise/common";
import { HttpResponseError } from "modules/api";
import { createAction } from "typesafe-actions";
import { UserStoreState, EMAIL_VERIFICATION_STATUS } from "./store";

/** ===========================================================================
 * Action Types
 * ============================================================================
 */

enum ActionTypesEnum {
  FETCH_USER = "FETCH_USER",
  FETCH_USER_SUCCESS = "FETCH_USER_SUCCESS",
  FETCH_USER_FAILURE = "FETCH_USER_FAILURE",

  UPDATE_USER = "UPDATE_USER",
  UPDATE_USER_SUCCESS = "UPDATE_USER_SUCCESS",
  UPDATE_USER_FAILURE = "UPDATE_USER_FAILURE",

  UPDATE_USER_EMAIL = "UPDATE_USER_EMAIL",
  UPDATE_USER_EMAIL_SUCCESS = "UPDATE_USER_EMAIL_SUCCESS",
  UPDATE_USER_EMAIL_FAILURE = "UPDATE_USER_EMAIL_FAILURE",

  DELETE_USER = "DELETE_USER",
  DELETE_USER_SUCCESS = "DELETE_USER_SUCCESS",
  DELETE_USER_FAILURE = "DELETE_USER_FAILURE",

  SET_EMAIL_VERIFICATION_STATUS = "SET_EMAIL_VERIFICATION_STATUS",

  UPDATE_USER_SETTINGS = "UPDATE_USER_SETTINGS",
  UPDATE_USER_SETTINGS_SUCCESS = "UPDATE_USER_SETTINGS_SUCCESS",
  UPDATE_USER_SETTINGS_FAILURE = "UPDATE_USER_SETTINGS_FAILURE",

  FETCH_USER_LEADERBOARD = "FETCH_USER_LEADERBOARD",
  FETCH_USER_LEADERBOARD_SUCCESS = "FETCH_USER_LEADERBOARD_SUCCESS",
  FETCH_USER_LEADERBOARD_FAILURE = "FETCH_USER_LEADERBOARD_FAILURE",

  DISCONNECT_ACCOUNT = "DISCONNECT_ACCOUNT",
  DISCONNECT_ACCOUNT_SUCCESS = "DISCONNECT_ACCOUNT_SUCCESS",
  DISCONNECT_ACCOUNT_FAILURE = "UPDATE_USER_SETTINGS_FAILURE",

  FETCH_PUBLIC_USER_PROFILE = "FETCH_PUBLIC_USER_PROFILE",
  FETCH_PUBLIC_USER_PROFILE_SUCCESS = "FETCH_PUBLIC_USER_PROFILE_SUCCESS",
  FETCH_PUBLIC_USER_PROFILE_FAILURE = "FETCH_PUBLIC_USER_PROFILE_FAILURE",
}

/** ===========================================================================
 * Actions
 * ============================================================================
 */

export const fetchUser = createAction(ActionTypesEnum.FETCH_USER)();

export const fetchUserSuccess = createAction(
  ActionTypesEnum.FETCH_USER_SUCCESS,
)<UserStoreState>();

export const fetchUserFailure = createAction(
  ActionTypesEnum.FETCH_USER_FAILURE,
)<HttpResponseError>();

export const updateUser = createAction(
  ActionTypesEnum.UPDATE_USER,
)<UserUpdateOptions>();

export const updateUserSuccess = createAction(
  ActionTypesEnum.UPDATE_USER_SUCCESS,
)<IUserDto>();

export const updateUserFailure = createAction(
  ActionTypesEnum.UPDATE_USER_FAILURE,
)<HttpResponseError>();

export const updateUserEmail = createAction(
  ActionTypesEnum.UPDATE_USER_EMAIL,
)<string>();

export const updateUserEmailSuccess = createAction(
  ActionTypesEnum.UPDATE_USER_EMAIL_SUCCESS,
)();

export const updateUserEmailFailure = createAction(
  ActionTypesEnum.UPDATE_USER_EMAIL_FAILURE,
)();

export const deleteUserAccount = createAction(ActionTypesEnum.DELETE_USER)();

export const deleteUserAccountSuccess = createAction(
  ActionTypesEnum.DELETE_USER_SUCCESS,
)();

export const deleteUserAccountFailure = createAction(
  ActionTypesEnum.DELETE_USER_FAILURE,
)<HttpResponseError>();

export const fetchUserLeaderboard = createAction(
  ActionTypesEnum.FETCH_USER_LEADERBOARD,
)();

export const fetchUserLeaderboardSuccess = createAction(
  ActionTypesEnum.FETCH_USER_LEADERBOARD_SUCCESS,
)<UserLeaderboardDto>();

export const fetchUserLeaderboardFailure = createAction(
  ActionTypesEnum.FETCH_USER_LEADERBOARD_FAILURE,
)<HttpResponseError>();

export const setEmailVerificationStatus = createAction(
  ActionTypesEnum.SET_EMAIL_VERIFICATION_STATUS,
)<EMAIL_VERIFICATION_STATUS>();

export const updateUserSettings = createAction(
  ActionTypesEnum.UPDATE_USER_SETTINGS,
)<Partial<UserSettings>>();

export const updateUserSettingsSuccess = createAction(
  ActionTypesEnum.UPDATE_USER_SETTINGS_SUCCESS,
)<UserStoreState>();

export const updateUserSettingsFailure = createAction(
  ActionTypesEnum.UPDATE_USER_SETTINGS_FAILURE,
)<HttpResponseError>();

export const disconnectAccount = createAction(
  ActionTypesEnum.DISCONNECT_ACCOUNT,
)<SSO>();

export const disconnectAccountSuccess = createAction(
  ActionTypesEnum.DISCONNECT_ACCOUNT_SUCCESS,
)<IUserDto<UserProfile>>();

export const disconnectAccountFailure = createAction(
  ActionTypesEnum.DISCONNECT_ACCOUNT_FAILURE,
)<HttpResponseError>();

export const fetchPublicUserProfile = createAction(
  ActionTypesEnum.FETCH_PUBLIC_USER_PROFILE,
)<{ username: string }>();

export const fetchPublicUserProfileSuccess = createAction(
  ActionTypesEnum.FETCH_PUBLIC_USER_PROFILE_SUCCESS,
)<PublicUserProfile>();

export const fetchPublicUserProfileFailure = createAction(
  ActionTypesEnum.FETCH_PUBLIC_USER_PROFILE_FAILURE,
)<HttpResponseError>();
