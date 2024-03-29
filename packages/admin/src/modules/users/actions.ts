import { HttpResponseError } from "modules/api";
import { createAction } from "typesafe-actions";
import { AdminProgressChartDto } from "../../../../common/dist/main";
import { AdminUserView } from "./store";

/** ===========================================================================
 * Action Types
 * ============================================================================
 */

enum ActionTypesEnum {
  FETCH_USERS = "FETCH_USERS",
  FETCH_USERS_SUCCESS = "FETCH_USERS_SUCCESS",
  FETCH_USERS_FAILURE = "FETCH_USERS_FAILURE",

  COMPLETE_COACHING_SESSION = "COMPLETE_COACHING_SESSION",
  COMPLETE_COACHING_SESSION_SUCCESS = "COMPLETE_COACHING_SESSION_SUCCESS",
  COMPLETE_COACHING_SESSION_FAILURE = "COMPLETE_COACHING_SESSION_FAILURE",

  DELETE_USER = "DELETE_USER",
  DELETE_USER_SUCCESS = "DELETE_USER_SUCCESS",
  DELETE_USER_FAILURE = "DELETE_USER_FAILURE",

  FETCH_ALL_USERS_PROGRESS = "FETCH_ALL_USERS_PROGRESS",
  FETCH_ALL_USERS_PROGRESS_SUCCESS = "FETCH_ALL_USERS_PROGRESS_SUCCESS",
  FETCH_ALL_USERS_PROGRESS_FAILURE = "FETCH_ALL_USERS_PROGRESS_FAILURE",
}

/** ===========================================================================
 * Actions
 * ============================================================================
 */

export const fetchUsers = createAction(ActionTypesEnum.FETCH_USERS)();

export const fetchUsersSuccess = createAction(
  ActionTypesEnum.FETCH_USERS_SUCCESS,
)<AdminUserView[]>();

export const fetchUsersFailure = createAction(
  ActionTypesEnum.FETCH_USERS_FAILURE,
)<HttpResponseError>();

export const markCoachingSessionComplete = createAction(
  ActionTypesEnum.COMPLETE_COACHING_SESSION,
)<{ userUuid: string }>();

export const markCoachingSessionCompleteSuccess = createAction(
  ActionTypesEnum.COMPLETE_COACHING_SESSION_SUCCESS,
)<{ userUuid: string }>();

export const markCoachingSessionCompleteFailure = createAction(
  ActionTypesEnum.COMPLETE_COACHING_SESSION_FAILURE,
)<HttpResponseError>();

export const deleteUserAccount = createAction(ActionTypesEnum.DELETE_USER)<{
  uuid: string;
}>();

export const deleteUserAccountSuccess = createAction(
  ActionTypesEnum.DELETE_USER_SUCCESS,
)();

export const deleteUserAccountFailure = createAction(
  ActionTypesEnum.DELETE_USER_FAILURE,
)<HttpResponseError>();

export const fetchAllUsersProgress = createAction(
  ActionTypesEnum.FETCH_ALL_USERS_PROGRESS,
)<{ courseId: string }>();

export const fetchAllUsersProgressSuccess = createAction(
  ActionTypesEnum.FETCH_ALL_USERS_PROGRESS_SUCCESS,
)<AdminProgressChartDto>();

export const fetchAllUsersProgressFailure = createAction(
  ActionTypesEnum.FETCH_ALL_USERS_PROGRESS_FAILURE,
)<HttpResponseError>();
