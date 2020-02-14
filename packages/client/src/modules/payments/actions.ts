import { createAction } from "typesafe-actions";
import { HttpResponseError } from "modules/api";
import { StripeStartCheckoutSuccessResponse } from "@pairwise/common";

/** ===========================================================================
 * Action Types
 * ============================================================================
 */

enum ActionTypesEnum {
  SET_PURCHASE_COURSE_MODAL_STATE = "SET_PURCHASE_COURSE_MODAL_STATE",

  HANDLE_PURCHASE_COURSE_INTENT = "HANDLE_PURCHASE_COURSE_INTENT",

  SET_PURCHASE_COURSE_ID = "SET_PURCHASE_COURSE_ID",

  START_CHECKOUT = "START_CHECKOUT",
  START_CHECKOUT_SUCCESS = "START_CHECKOUT_SUCCESS",
  START_CHECKOUT_FAILURE = "START_CHECKOUT_FAILURE",
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
)<{ courseId: string }>();

export const startCheckout = createAction(ActionTypesEnum.START_CHECKOUT)<{
  courseId: string;
}>();

export const startCheckoutSuccess = createAction(
  ActionTypesEnum.START_CHECKOUT_SUCCESS,
)<StripeStartCheckoutSuccessResponse>();

export const startCheckoutFailure = createAction(
  ActionTypesEnum.START_CHECKOUT_FAILURE,
)<HttpResponseError>();
