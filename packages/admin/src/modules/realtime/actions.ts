import { HttpResponseError } from "modules/api";
import { createAction } from "typesafe-actions";
import { ProgressRecords } from "./store";

/** ===========================================================================
 * Action Types
 * ============================================================================
 */

enum ActionTypesEnum {
  FETCH_PROGRESS_RECORDS = "FETCH_PROGRESS_RECORDS",
  FETCH_PROGRESS_RECORDS_SUCCESS = "FETCH_PROGRESS_RECORDS_SUCCESS",
  FETCH_PROGRESS_RECORDS_FAILURE = "FETCH_PROGRESS_RECORDS_FAILURE",
}

/** ===========================================================================
 * Actions
 * ============================================================================
 */

export const fetchProgressRecords = createAction(
  ActionTypesEnum.FETCH_PROGRESS_RECORDS,
)();

export const fetchProgressRecordsSuccess = createAction(
  ActionTypesEnum.FETCH_PROGRESS_RECORDS_SUCCESS,
)<ProgressRecords>();

export const fetchProgressRecordsFailure = createAction(
  ActionTypesEnum.FETCH_PROGRESS_RECORDS_FAILURE,
)<HttpResponseError>();
