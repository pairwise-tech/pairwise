import { ActionType, createAction } from "typesafe-actions";
import { Location } from "history";

/** ===========================================================================
 * Action Types
 * ============================================================================
 */

enum ActionTypesEnum {
  EMPTY_ACTION = "EMPTY_ACTION" /* Empty action */,
  SET_PURCHASE_COURSE_MODAL_STATE = "SET_PURCHASE_COURSE_MODAL_STATE",
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

const empty = createAction(ActionTypesEnum.EMPTY_ACTION)();

const setPurchaseCourseModalState = createAction(
  ActionTypesEnum.SET_PURCHASE_COURSE_MODAL_STATE,
)<boolean>();

const locationChange = createAction(ActionTypesEnum.LOCATION_CHANGE)<
  Location
>();

const logoutUser = createAction(ActionTypesEnum.LOGOUT)();

const initializeApp = createAction(ActionTypesEnum.INITIALIZE_APP)();
const initializeAppSuccess = createAction(
  ActionTypesEnum.INITIALIZE_APP_SUCCESS,
)();

const actions = {
  locationChange,
  empty,
  setPurchaseCourseModalState,
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
