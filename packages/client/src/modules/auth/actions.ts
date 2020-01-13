import { ActionType, createAction } from "typesafe-actions";

/** ===========================================================================
 * Action Types
 * ============================================================================
 */

enum ActionTypesEnum {
  SET_SINGLE_SIGN_ON_DIALOG_STATE = "SET_SINGLE_SIGN_ON_DIALOG_STATE",

  INITIALIZE_ACCESS_TOKEN = "INITIALIZE_ACCESS_TOKEN",

  STORE_ACCESS_TOKEN = "STORE_ACCESS_TOKEN",
  STORE_ACCESS_TOKEN_SUCCESS = "STORE_ACCESS_TOKEN_SUCCESS",
}

/** ===========================================================================
 * Actions
 * ============================================================================
 */

const initializeAccessToken = createAction(
  ActionTypesEnum.INITIALIZE_ACCESS_TOKEN,
)<{ initialWindowLocationSearch: string }>();

const setSingleSignOnDialogState = createAction(
  ActionTypesEnum.SET_SINGLE_SIGN_ON_DIALOG_STATE,
)<boolean>();

const storeAccessToken = createAction(ActionTypesEnum.STORE_ACCESS_TOKEN)<{
  accessToken: string;
  accountCreated: boolean;
}>();

const storeAccessTokenSuccess = createAction(
  ActionTypesEnum.STORE_ACCESS_TOKEN_SUCCESS,
)<{ accessToken: string }>();

const actions = {
  initializeAccessToken,
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
