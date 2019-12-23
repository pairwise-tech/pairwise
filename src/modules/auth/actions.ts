import { ActionType, createAction } from "typesafe-actions";

/** ===========================================================================
 * Action Types
 * ============================================================================
 */

enum ActionTypesEnum {
  SET_SINGLE_SIGN_ON_DIALOG_STATE = "SET_SINGLE_SIGN_ON_DIALOG_STATE",

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

const facebookLogin = createAction(ActionTypesEnum.FACEBOOK_LOGIN)<any>();
const facebookLoginFailure = createAction(
  ActionTypesEnum.FACEBOOK_LOGIN_FAILURE,
)();
const facebookLoginSuccess = createAction(
  ActionTypesEnum.FACEBOOK_LOGIN_SUCCESS,
)<{ accessToken: string }>();

const actions = {
  facebookLogin,
  facebookLoginFailure,
  facebookLoginSuccess,
  setSingleSignOnDialogState,
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export type ActionTypes = ActionType<typeof actions>;

export default actions;
