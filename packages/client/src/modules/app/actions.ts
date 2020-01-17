import { ActionType, createAction } from "typesafe-actions";
import { Location } from "history";

/** ===========================================================================
 * Action Types
 * ============================================================================
 */

enum ActionTypesEnum {
  EMPTY_ACTION = "EMPTY_ACTION",
  INITIALIZE_APP = "INITIALIZE_APP",
  INITIALIZE_APP_SUCCESS = "INITIALIZE_APP_SUCCESS",
  TOGGLE_PAGE_SCROLL_LOCK = "TOGGLE_PAGE_SCROLL_LOCK",
  LOGOUT = "LOGOUT",
  LOCATION_CHANGE = "LOCATION_CHANGE",
}

/** ===========================================================================
 * Actions
 * ============================================================================
 */

/**
 * The empty action is used at various places in the epics to handle a code
 * path which does not produce any relevant action. But it still represents
 * some event happening, i.e. that code path, and the epics have to return
 * actions anyway, so we can return this empty action, and include a string
 * payload which describes where the action is coming from (for debugging
 * or informational purposes).
 */
const empty = createAction(ActionTypesEnum.EMPTY_ACTION)<string>();

const locationChange = createAction(ActionTypesEnum.LOCATION_CHANGE)<
  Location
>();

const logoutUser = createAction(ActionTypesEnum.LOGOUT)();

const initializeApp = createAction(ActionTypesEnum.INITIALIZE_APP)();

const initializeAppSuccess = createAction(
  ActionTypesEnum.INITIALIZE_APP_SUCCESS,
)<{ accessToken: string }>();

const actions = {
  locationChange,
  empty,
  logoutUser,
  initializeApp,
  initializeAppSuccess,
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export type ActionTypes = ActionType<typeof actions>;

export default actions;
