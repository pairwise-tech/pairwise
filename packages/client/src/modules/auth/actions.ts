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

  INITIATE_BULK_PERSISTENCE = "INITIATE_BULK_PERSISTENCE",
  BULK_PERSISTENCE_COMPLETE = "BULK_PERSISTENCE_COMPLETE",
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
)<{ accessToken: string; accountCreated: boolean }>();

const initiateBulkPersistence = createAction(
  ActionTypesEnum.INITIATE_BULK_PERSISTENCE,
)();

const bulkPersistenceComplete = createAction(
  ActionTypesEnum.BULK_PERSISTENCE_COMPLETE,
)();

const actions = {
  initializeAccessToken,
  setSingleSignOnDialogState,
  storeAccessToken,
  storeAccessTokenSuccess,
  initiateBulkPersistence,
  bulkPersistenceComplete,
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export type ActionTypes = ActionType<typeof actions>;

export default actions;
