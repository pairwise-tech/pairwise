import { ActionType, createAction } from "typesafe-actions";

/** ===========================================================================
 * Action Types
 * ============================================================================
 */

enum ActionTypesEnum {
  SET_PURCHASE_COURSE_MODAL_STATE = "SET_PURCHASE_COURSE_MODAL_STATE",

  HANDLE_PURCHASE_COURSE_INTENT = "HANDLE_PURCHASE_COURSE_INTENT",

  SET_PURCHASE_COURSE_ID = "SET_PURCHASE_COURSE_ID",
}

/** ===========================================================================
 * Actions
 * ============================================================================
 */

const setPurchaseCourseModalState = createAction(
  ActionTypesEnum.SET_PURCHASE_COURSE_MODAL_STATE,
)<boolean>();

const handlePurchaseCourseIntent = createAction(
  ActionTypesEnum.HANDLE_PURCHASE_COURSE_INTENT,
)<{ courseId: string }>();

const setPurchaseCourseId = createAction(
  ActionTypesEnum.SET_PURCHASE_COURSE_ID,
)<string>();

const actions = {
  setPurchaseCourseId,
  handlePurchaseCourseIntent,
  setPurchaseCourseModalState,
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export type ActionTypes = ActionType<typeof actions>;

export default actions;
