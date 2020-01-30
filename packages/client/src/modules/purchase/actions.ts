import { createAction } from "typesafe-actions";

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

export const setPurchaseCourseModalState = createAction(
  ActionTypesEnum.SET_PURCHASE_COURSE_MODAL_STATE,
)<boolean>();

export const handlePurchaseCourseIntent = createAction(
  ActionTypesEnum.HANDLE_PURCHASE_COURSE_INTENT,
)<{ courseId: string }>();

export const setPurchaseCourseId = createAction(
  ActionTypesEnum.SET_PURCHASE_COURSE_ID,
)<string>();
