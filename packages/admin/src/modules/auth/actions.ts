import { IUserDto } from "@pairwise/common";
import { HttpResponseError } from "modules/api";
import { createAction } from "typesafe-actions";

/** ===========================================================================
 * Action Types
 * ============================================================================
 */

enum ActionTypesEnum {
  SET_SINGLE_SIGN_ON_DIALOG_STATE = "SET_SINGLE_SIGN_ON_DIALOG_STATE",

  STORE_ACCESS_TOKEN = "STORE_ACCESS_TOKEN",
  STORE_ACCESS_TOKEN_SUCCESS = "STORE_ACCESS_TOKEN_SUCCESS",

  LOGOUT = "LOGOUT",

  ADMIN_USER_LOGIN = "ADMIN_USER_LOGIN",
  ADMIN_USER_LOGIN_SUCCESS = "ADMIN_USER_LOGIN_SUCCESS",
  ADMIN_USER_LOGIN_FAILURE = "ADMIN_USER_LOGIN_FAILURE",
}

/** ===========================================================================
 * Actions
 * ============================================================================
 */

export const setSingleSignOnDialogState = createAction(
  ActionTypesEnum.SET_SINGLE_SIGN_ON_DIALOG_STATE,
)<boolean>();

export const storeAccessToken = createAction(
  ActionTypesEnum.STORE_ACCESS_TOKEN,
)<{
  accessToken: string;
  accountCreated: boolean;
}>();

export const storeAccessTokenSuccess = createAction(
  ActionTypesEnum.STORE_ACCESS_TOKEN_SUCCESS,
)<{ accessToken: string; accountCreated: boolean }>();

export const logoutUser = createAction(ActionTypesEnum.LOGOUT)();

export const adminUserLogin = createAction(ActionTypesEnum.ADMIN_USER_LOGIN)();

export const adminUserLoginSuccess = createAction(
  ActionTypesEnum.ADMIN_USER_LOGIN_SUCCESS,
)();

export const adminUserLoginFailure = createAction(
  ActionTypesEnum.ADMIN_USER_LOGIN_FAILURE,
)<HttpResponseError>();
