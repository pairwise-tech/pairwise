import { HttpResponseError } from "modules/api";
import { createAction } from "typesafe-actions";
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
