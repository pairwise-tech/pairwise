import { createAction } from "typesafe-actions";
import {
  FEEDBACK_TYPE,
  IFeedbackDto,
  IGenericFeedback,
} from "@pairwise/common";
import { HttpResponseError } from "modules/api";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

enum ActionTypesEnum {
  SET_FEEDBACK_DIALOG_STATE = "SET_FEEDBACK_DIALOG_STATE",
  SET_FEEDBACK_STATE = "SET_FEEDBACK_STATE",
  SET_FEEDBACK_TYPE = "SET_FEEDBACK_TYPE",

  SUBMIT_USER_FEEDBACK = "SUBMIT_USER_FEEDBACK",
  SUBMIT_USER_FEEDBACK_SUCCESS = "SUBMIT_USER_FEEDBACK_SUCCESS",
  SUBMIT_USER_FEEDBACK_FAILURE = "SUBMIT_USER_FEEDBACK_FAILURE",

  SUBMIT_GENERAL_FEEDBACK = "SUBMIT_GENERAL_FEEDBACK",
  SUBMIT_GENERAL_FEEDBACK_SUCCESS = "SUBMIT_GENERAL_FEEDBACK_SUCCESS",
  SUBMIT_GENERAL_FEEDBACK_FAILURE = "SUBMIT_GENERAL_FEEDBACK_FAILURE",
}

export enum FEEDBACK_DIALOG_TYPES {
  // Modal is closed
  CLOSED = "CLOSED",

  // Modal handles submitting feedback for a challenge
  CHALLENGE_FEEDBACK = "CHALLENGE_FEEDBACK",

  // Modal handles submitting generic non-challenge specific feedback
  ASK_A_QUESTION = "ASK_A_QUESTION",
  PAIRWISE_LIVE_REQUEST = "PAIRWISE_LIVE_REQUEST",
}

/** ===========================================================================
 * Actions
 * ============================================================================
 */

export const setFeedbackDialogState = createAction(
  ActionTypesEnum.SET_FEEDBACK_DIALOG_STATE,
)<FEEDBACK_DIALOG_TYPES>();

export const setFeedbackState = createAction(
  ActionTypesEnum.SET_FEEDBACK_STATE,
)<string>();

export const setFeedbackType = createAction(
  ActionTypesEnum.SET_FEEDBACK_TYPE,
)<FEEDBACK_TYPE>();

export const submitUserFeedback = createAction(
  ActionTypesEnum.SUBMIT_USER_FEEDBACK,
)<IFeedbackDto>();

export const submitUserFeedbackSuccess = createAction(
  ActionTypesEnum.SUBMIT_USER_FEEDBACK_SUCCESS,
)();

export const submitUserFeedbackFailure = createAction(
  ActionTypesEnum.SUBMIT_USER_FEEDBACK_FAILURE,
)<HttpResponseError>();

export const submitGeneralFeedback = createAction(
  ActionTypesEnum.SUBMIT_GENERAL_FEEDBACK,
)<IGenericFeedback>();

export const submitGeneralFeedbackSuccess = createAction(
  ActionTypesEnum.SUBMIT_GENERAL_FEEDBACK_SUCCESS,
)();

export const submitGeneralFeedbackFailure = createAction(
  ActionTypesEnum.SUBMIT_GENERAL_FEEDBACK_FAILURE,
)<HttpResponseError>();
