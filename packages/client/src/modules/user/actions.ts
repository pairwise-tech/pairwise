import { IUserDto, UserUpdateOptions, UserSettings } from "@pairwise/common";
import { HttpResponseError } from "modules/api";
import { createAction } from "typesafe-actions";
import { UserStoreState } from "./store";

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

  UPDATE_USER_SETTINGS = "UPDATE_USER_SETTINGS",
  UPDATE_USER_SETTINGS_SUCCESS = "UPDATE_USER_SETTINGS_SUCCESS",
  UPDATE_USER_SETTINGS_FAILURE = "UPDATE_USER_SETTINGS_FAILURE",
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

export const updateUser = createAction(ActionTypesEnum.UPDATE_USER)<
  UserUpdateOptions
>();

export const updateUserSuccess = createAction(
  ActionTypesEnum.UPDATE_USER_SUCCESS,
)<IUserDto>();

export const updateUserFailure = createAction(
  ActionTypesEnum.UPDATE_USER_FAILURE,
)<HttpResponseError>();

export const updateUserSettings = createAction(
  ActionTypesEnum.UPDATE_USER_SETTINGS,
)<Partial<UserSettings>>();

export const updateUserSettingsSuccess = createAction(
  ActionTypesEnum.UPDATE_USER_SETTINGS_SUCCESS,
)<UserStoreState>();

export const updateUserSettingsFailure = createAction(
  ActionTypesEnum.UPDATE_USER_SETTINGS_FAILURE,
)<HttpResponseError>();
