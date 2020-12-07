import { createAction } from "typesafe-actions";

/** ===========================================================================
 * Action Types
 * ============================================================================
 */

enum ActionTypesEnum {
  SET_SINGLE_SIGN_ON_DIALOG_STATE = "SET_SINGLE_SIGN_ON_DIALOG_STATE",

  STORE_ACCESS_TOKEN = "STORE_ACCESS_TOKEN",
  STORE_ACCESS_TOKEN_SUCCESS = "STORE_ACCESS_TOKEN_SUCCESS",
  STORE_ACCESS_TOKEN_FAILURE = "STORE_ACCESS_TOKEN_FAILURE",

  LOGOUT = "LOGOUT",
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

export const storeAccessTokenFailure = createAction(
  ActionTypesEnum.STORE_ACCESS_TOKEN_FAILURE,
)();

export const logoutUser = createAction(ActionTypesEnum.LOGOUT)();
