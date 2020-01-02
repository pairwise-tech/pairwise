import { ActionType, createAction } from "typesafe-actions";

/** ===========================================================================
 * Action Types
 * ============================================================================
 */

enum ActionTypesEnum {
  EMPTY_ACTION = "EMPTY_ACTION" /* Empty action */,
  INITIALIZE_APP = "INITIALIZE_APP",
  INITIALIZE_APP_SUCCESS = "INITIALIZE_APP_SUCCESS",
  TOGGLE_PAGE_SCROLL_LOCK = "TOGGLE_PAGE_SCROLL_LOCK",
  LOGOUT = "LOGOUT",
}

/** ===========================================================================
 * Actions
 * ============================================================================
 */

const empty = createAction(ActionTypesEnum.EMPTY_ACTION)();

const logoutUser = createAction(ActionTypesEnum.LOGOUT)();

const initializeApp = createAction(ActionTypesEnum.INITIALIZE_APP)();
const initializeAppSuccess = createAction(
  ActionTypesEnum.INITIALIZE_APP_SUCCESS,
)();

const toggleScrollLock = createAction(ActionTypesEnum.TOGGLE_PAGE_SCROLL_LOCK)<{
  locked: boolean;
}>();

const actions = {
  empty,
  logoutUser,
  initializeApp,
  initializeAppSuccess,
  toggleScrollLock,
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export type ActionTypes = ActionType<typeof actions>;

export default actions;
