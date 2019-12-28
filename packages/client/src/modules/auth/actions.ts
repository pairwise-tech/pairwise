import { ActionType, createAction } from "typesafe-actions";

/** ===========================================================================
 * Action Types
 * ============================================================================
 */

enum ActionTypesEnum {
  SET_SINGLE_SIGN_ON_DIALOG_STATE = "SET_SINGLE_SIGN_ON_DIALOG_STATE",

  STORE_ACCESS_TOKEN = "STORE_ACCESS_TOKEN",
  STORE_ACCESS_TOKEN_SUCCESS = "STORE_ACCESS_TOKEN_SUCCESS",

  FACEBOOK_LOGIN = "FACEBOOK_LOGIN",
  FACEBOOK_LOGIN_FAILURE = "FACEBOOK_LOGIN_FAILURE",
  FACEBOOK_LOGIN_SUCCESS = "FACEBOOK_LOGIN_SUCCESS",
}

/** ===========================================================================
 * Actions
 * ============================================================================
 */

const setSingleSignOnDialogState = createAction(
  ActionTypesEnum.SET_SINGLE_SIGN_ON_DIALOG_STATE,
)<boolean>();

const storeAccessToken = createAction(ActionTypesEnum.STORE_ACCESS_TOKEN)<{
  accessToken: string;
}>();

const storeAccessTokenSuccess = createAction(
  ActionTypesEnum.STORE_ACCESS_TOKEN_SUCCESS,
)<{ accessToken: string }>();

const facebookLogin = createAction(ActionTypesEnum.FACEBOOK_LOGIN)<any>();
const facebookLoginFailure = createAction(
  ActionTypesEnum.FACEBOOK_LOGIN_FAILURE,
)();
const facebookLoginSuccess = createAction(
  ActionTypesEnum.FACEBOOK_LOGIN_SUCCESS,
)<{ access_token: string }>();

const actions = {
  facebookLogin,
  facebookLoginFailure,
  facebookLoginSuccess,
  setSingleSignOnDialogState,
  storeAccessToken,
  storeAccessTokenSuccess,
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export type ActionTypes = ActionType<typeof actions>;

export default actions;
