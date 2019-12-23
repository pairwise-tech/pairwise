import { ActionType, createAction } from "typesafe-actions";

/** ===========================================================================
 * Action Types
 * ============================================================================
 */

enum ActionTypesEnum {
  EMPTY_ACTION = "EMPTY_ACTION" /* Empty action */,
  INITIALIZE_APP = "INITIALIZE_APP",
  INITIALIZE_APP_SUCCESS = "INITIALIZE_APP_SUCCESS",

  SET_SINGLE_SIGN_ON_DIALOG_STATE = "SET_SINGLE_SIGN_ON_DIALOG_STATE",

  FACEBOOK_LOGIN = "FACEBOOK_LOGIN",
  FACEBOOK_LOGIN_FAILURE = "FACEBOOK_LOGIN_FAILURE",
  FACEBOOK_LOGIN_SUCCESS = "FACEBOOK_LOGIN_SUCCESS",
}

/** ===========================================================================
 * Actions
 * ============================================================================
 */

const empty = createAction(ActionTypesEnum.EMPTY_ACTION)();

const setSingleSignOnDialogState = createAction(
  ActionTypesEnum.SET_SINGLE_SIGN_ON_DIALOG_STATE,
)<boolean>();

const initializeApp = createAction(ActionTypesEnum.INITIALIZE_APP)();
const initializeAppSuccess = createAction(
  ActionTypesEnum.INITIALIZE_APP_SUCCESS,
)();

const facebookLogin = createAction(ActionTypesEnum.FACEBOOK_LOGIN)<any>();
const facebookLoginFailure = createAction(
  ActionTypesEnum.FACEBOOK_LOGIN_FAILURE,
)();
const facebookLoginSuccess = createAction(
  ActionTypesEnum.FACEBOOK_LOGIN_SUCCESS,
)();

const actions = {
  empty,
  initializeApp,
  initializeAppSuccess,
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
