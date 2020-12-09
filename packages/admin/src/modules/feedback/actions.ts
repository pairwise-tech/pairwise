import { HttpResponseError } from "modules/api";
import { createAction } from "typesafe-actions";
import { FeedbackRecord } from "./store";

/** ===========================================================================
 * Action Types
 * ============================================================================
 */

enum ActionTypesEnum {
  FETCH_ALL_FEEDBACK = "FETCH_ALL_FEEDBACK",
  FETCH_ALL_FEEDBACK_SUCCESS = "FETCH_ALL_FEEDBACK_SUCCESS",
  FETCH_ALL_FEEDBACK_FAILURE = "FETCH_ALL_FEEDBACK_FAILURE",

  DELETE_FEEDBACK = "DELETE_FEEDBACK",
  DELETE_FEEDBACK_SUCCESS = "DELETE_FEEDBACK_SUCCESS",
  DELETE_FEEDBACK_FAILURE = "DELETE_FEEDBACK_FAILURE",
}

/** ===========================================================================
 * Actions
 * ============================================================================
 */

export const fetchAllFeedback = createAction(
  ActionTypesEnum.FETCH_ALL_FEEDBACK,
)();

export const fetchAllFeedbackSuccess = createAction(
  ActionTypesEnum.FETCH_ALL_FEEDBACK_SUCCESS,
)<FeedbackRecord[]>();

export const fetchAllFeedbackFailure = createAction(
  ActionTypesEnum.FETCH_ALL_FEEDBACK_FAILURE,
)<HttpResponseError>();

export const deleteFeedbackByUuid = createAction(
  ActionTypesEnum.DELETE_FEEDBACK,
)<string>();

export const deleteFeedbackByUuidSuccess = createAction(
  ActionTypesEnum.DELETE_FEEDBACK_SUCCESS,
)<string>();

export const deleteFeedbackByUuidFailure = createAction(
  ActionTypesEnum.DELETE_FEEDBACK_FAILURE,
)<HttpResponseError>();
