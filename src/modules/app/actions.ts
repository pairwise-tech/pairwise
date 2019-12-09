import { ActionType, createAction } from "typesafe-actions";

/** ===========================================================================
 * Action Types
 * ============================================================================
 */

enum ActionTypesEnum {
  EMPTY_ACTION = "EMPTY_ACTION" /* Empty action */,
  INITIALIZE_APP = "INITIALIZE_APP",
  INITIALIZE_APP_SUCCESS = "INITIALIZE_APP_SUCCESS",
}

/** ===========================================================================
 * Actions
 * ============================================================================
 */

const empty = createAction(ActionTypesEnum.EMPTY_ACTION)();

const initializeApp = createAction(ActionTypesEnum.INITIALIZE_APP)();
const initializeAppSuccess = createAction(
  ActionTypesEnum.INITIALIZE_APP_SUCCESS,
)();

const actions = {
  empty,
  initializeApp,
  initializeAppSuccess,
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export type ActionTypes = ActionType<typeof actions>;

export default actions;
