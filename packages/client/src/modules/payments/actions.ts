import { createAction } from "typesafe-actions";
import { HttpResponseError } from "modules/api";
import {
  PaymentRequestDto,
  StripeStartCheckoutSuccessResponse,
} from "@pairwise/common";

/** ===========================================================================
 * Action Types
 * ============================================================================
 */

enum ActionTypesEnum {
  SET_PAYMENT_COURSE_MODAL_STATE = "SET_PAYMENT_COURSE_MODAL_STATE",
  SET_PAYMENT_SUCCESS_MODAL_STATE = "SET_PAYMENT_SUCCESS_MODAL_STATE",

  HANDLE_PAYMENT_COURSE_INTENT = "HANDLE_PAYMENT_COURSE_INTENT",

  SET_PAYMENT_COURSE_ID = "SET_PAYMENT_COURSE_ID",

  START_CHECKOUT = "START_CHECKOUT",
  START_CHECKOUT_SUCCESS = "START_CHECKOUT_SUCCESS",
  START_CHECKOUT_FAILURE = "START_CHECKOUT_FAILURE",

  PAYMENT_SUCCESS = "PAYMENT_SUCCESS",

  STRIPE_REDIRECT_SUCCESS = "STRIPE_REDIRECT_SUCCESS",
  STRIPE_REDIRECT_FAILURE = "STRIPE_REDIRECT_FAILURE",
}

/** ===========================================================================
 * Actions
 * ============================================================================
 */

export const setPaymentCourseModalState = createAction(
  ActionTypesEnum.SET_PAYMENT_COURSE_MODAL_STATE,
)<boolean>();

export const handlePaymentCourseIntent = createAction(
  ActionTypesEnum.HANDLE_PAYMENT_COURSE_INTENT,
)<{ courseId: string; showToastWarning?: boolean }>();

export const setPaymentCourseId = createAction(
  ActionTypesEnum.SET_PAYMENT_COURSE_ID,
)<{ courseId: string }>();

export const startCheckout = createAction(
  ActionTypesEnum.START_CHECKOUT,
)<PaymentRequestDto>();

export const startCheckoutSuccess = createAction(
  ActionTypesEnum.START_CHECKOUT_SUCCESS,
)<StripeStartCheckoutSuccessResponse>();

export const startCheckoutFailure = createAction(
  ActionTypesEnum.START_CHECKOUT_FAILURE,
)<HttpResponseError>();

export const setPaymentSuccess = createAction(ActionTypesEnum.PAYMENT_SUCCESS)<{
  courseId: string;
}>();

export const setPaymentSuccessModalState = createAction(
  ActionTypesEnum.SET_PAYMENT_SUCCESS_MODAL_STATE,
)<boolean>();

export const redirectToStripeSuccess = createAction(
  ActionTypesEnum.STRIPE_REDIRECT_SUCCESS,
)();

export const redirectToStripeFailure = createAction(
  ActionTypesEnum.STRIPE_REDIRECT_FAILURE,
)();
