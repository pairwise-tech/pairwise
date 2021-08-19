import { createAction } from "typesafe-actions";

/** ===========================================================================
 * Action Types
 * ============================================================================
 */

enum ActionTypesEnum {
  SET_SINGLE_SIGN_ON_DIALOG_STATE = "SET_SINGLE_SIGN_ON_DIALOG_STATE",

  STORE_ACCESS_TOKEN = "STORE_ACCESS_TOKEN",
  STORE_ACCESS_TOKEN_SUCCESS = "STORE_ACCESS_TOKEN_SUCCESS",

  INITIATE_BULK_PERSISTENCE = "INITIATE_BULK_PERSISTENCE",
  BULK_PERSISTENCE_COMPLETE = "BULK_PERSISTENCE_COMPLETE",

  LOGOUT = "LOGOUT",
  LOGOUT_SUCCESS = "LOGOUT_SUCCESS",

  LOGIN_BY_EMAIL = "LOGIN_BY_EMAIL",
  LOGIN_BY_EMAIL_SUCCESS = "LOGIN_BY_EMAIL_SUCCESS",
  LOGIN_BY_EMAIL_FAILURE = "LOGIN_BY_EMAIL_FAILURE",

  USER_IS_ADMIN = "USER_IS_ADMIN",
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

export const initiateBulkPersistence = createAction(
  ActionTypesEnum.INITIATE_BULK_PERSISTENCE,
)();

export const bulkPersistenceComplete = createAction(
  ActionTypesEnum.BULK_PERSISTENCE_COMPLETE,
)();

export const logoutUser = createAction(ActionTypesEnum.LOGOUT)<{
  shouldReloadPage?: boolean;
}>();

export const logoutUserSuccess = createAction(ActionTypesEnum.LOGOUT_SUCCESS)<{
  shouldReloadPage?: boolean;
}>();

export const loginByEmail = createAction(ActionTypesEnum.LOGIN_BY_EMAIL)<{
  email: string;
}>();

export const loginByEmailSuccess = createAction(
  ActionTypesEnum.LOGIN_BY_EMAIL_SUCCESS,
)();

export const loginByEmailFailure = createAction(
  ActionTypesEnum.LOGIN_BY_EMAIL_FAILURE,
)();

export const userIsAdmin = createAction(ActionTypesEnum.USER_IS_ADMIN)();
