import { ActionType, createAction } from "typesafe-actions";

/** ===========================================================================
 * Action Types
 * ============================================================================
 */

enum ActionTypesEnum {
  UPDATE_USER = "UPDATE_USER",
}

/** ===========================================================================
 * Actions
 * ============================================================================
 */

const updateUser = createAction(ActionTypesEnum.UPDATE_USER)();

const actions = {
  updateUser,
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export type ActionTypes = ActionType<typeof actions>;

export default actions;
