import { HttpResponseError } from "modules/api";
import { createAction } from "typesafe-actions";
import { PaymentRecord } from "./store";

/** ===========================================================================
 * Action Types
 * ============================================================================
 */

enum ActionTypesEnum {
  FETCH_ALL_PAYMENTS = "FETCH_ALL_PAYMENTS",
  FETCH_ALL_PAYMENTS_SUCCESS = "FETCH_ALL_PAYMENTS_SUCCESS",
  FETCH_ALL_PAYMENTS_FAILURE = "FETCH_ALL_PAYMENTS_FAILURE",

  GIFT_COURSE_FOR_USER = "GIFT_COURSE_FOR_USER",
  GIFT_COURSE_FOR_USER_SUCCESS = "GIFT_COURSE_FOR_USER_SUCCESS",
  GIFT_COURSE_FOR_USER_FAILURE = "GIFT_COURSE_FOR_USER_FAILURE",

  REFUND_COURSE_FOR_USER = "REFUND_COURSE_FOR_USER",
  REFUND_COURSE_FOR_USER_SUCCESS = "REFUND_COURSE_FOR_USER_SUCCESS",
  REFUND_COURSE_FOR_USER_FAILURE = "REFUND_COURSE_FOR_USER_FAILURE",
}

/** ===========================================================================
 * Actions
 * ============================================================================
 */

export const fetchAllPayments = createAction(
  ActionTypesEnum.FETCH_ALL_PAYMENTS,
)();

export const fetchAllPaymentsSuccess = createAction(
  ActionTypesEnum.FETCH_ALL_PAYMENTS_SUCCESS,
)<PaymentRecord[]>();

export const fetchAllPaymentsFailure = createAction(
  ActionTypesEnum.FETCH_ALL_PAYMENTS_FAILURE,
)<HttpResponseError>();

export const giftCourseForUser = createAction(
  ActionTypesEnum.GIFT_COURSE_FOR_USER,
)<string>();

export const giftCourseForUserSuccess = createAction(
  ActionTypesEnum.GIFT_COURSE_FOR_USER_SUCCESS,
)<string>();

export const giftCourseForUserFailure = createAction(
  ActionTypesEnum.GIFT_COURSE_FOR_USER_FAILURE,
)<HttpResponseError>();

export const refundCourseForUser = createAction(
  ActionTypesEnum.REFUND_COURSE_FOR_USER,
)<string>();

export const refundCourseForUserSuccess = createAction(
  ActionTypesEnum.REFUND_COURSE_FOR_USER_SUCCESS,
)<string>();

export const refundCourseForUserFailure = createAction(
  ActionTypesEnum.REFUND_COURSE_FOR_USER_FAILURE,
)<HttpResponseError>();
