import { HttpResponseError } from "modules/api";
import { createAction } from "typesafe-actions";
import { UserSettings } from "@pairwise/common";
import { UserStoreState } from "./store";

/** ===========================================================================
 * Action Types
 * ============================================================================
 */

enum ActionTypesEnum {
  FETCH_ADMIN_USER = "FETCH_ADMIN_USER",
  FETCH_ADMIN_USER_SUCCESS = "FETCH_ADMIN_USER_SUCCESS",
  FETCH_ADMIN_USER_FAILURE = "FETCH_ADMIN_USER_FAILURE",

  ADMIN_ADMIN_USER_LOGIN = "ADMIN_ADMIN_USER_LOGIN",
  ADMIN_ADMIN_USER_LOGIN_SUCCESS = "ADMIN_ADMIN_USER_LOGIN_SUCCESS",
  ADMIN_ADMIN_USER_LOGIN_FAILURE = "ADMIN_ADMIN_USER_LOGIN_FAILURE",

  UPDATE_USER_SETTINGS = "UPDATE_USER_SETTINGS",
  UPDATE_USER_SETTINGS_SUCCESS = "UPDATE_USER_SETTINGS_SUCCESS",
  UPDATE_USER_SETTINGS_FAILURE = "UPDATE_USER_SETTINGS_FAILURE",
}

/** ===========================================================================
 * Actions
 * ============================================================================
 */

export const fetchAdminUser = createAction(ActionTypesEnum.FETCH_ADMIN_USER)();

export const fetchAdminUserSuccess = createAction(
  ActionTypesEnum.FETCH_ADMIN_USER_SUCCESS,
)<UserStoreState>();

export const fetchAdminUserFailure = createAction(
  ActionTypesEnum.FETCH_ADMIN_USER_FAILURE,
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
