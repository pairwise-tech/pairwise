import { HttpResponseError } from "modules/api";
import { createAction } from "typesafe-actions";
import { RecentProgressAdminDto } from "@pairwise/common";

/** ===========================================================================
 * Action Types
 * ============================================================================
 */

enum ActionTypesEnum {
  REFRESH_STATS = "REFRESH_STATS",

  FETCH_PROGRESS_RECORDS = "FETCH_PROGRESS_RECORDS",
  FETCH_PROGRESS_RECORDS_SUCCESS = "FETCH_PROGRESS_RECORDS_SUCCESS",
  FETCH_PROGRESS_RECORDS_FAILURE = "FETCH_PROGRESS_RECORDS_FAILURE",
}

/** ===========================================================================
 * Actions
 * ============================================================================
 */

export const refreshStats = createAction(ActionTypesEnum.REFRESH_STATS)();

export const fetchProgressRecords = createAction(
  ActionTypesEnum.FETCH_PROGRESS_RECORDS,
)();

export const fetchProgressRecordsSuccess = createAction(
  ActionTypesEnum.FETCH_PROGRESS_RECORDS_SUCCESS,
)<RecentProgressAdminDto>();

export const fetchProgressRecordsFailure = createAction(
  ActionTypesEnum.FETCH_PROGRESS_RECORDS_FAILURE,
)<HttpResponseError>();
