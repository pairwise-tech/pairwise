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

  REVOKE_COACHING_SESSION = "REVOKE_COACHING_SESSION",
  REVOKE_COACHING_SESSION_SUCCESS = "REVOKE_COACHING_SESSION_SUCCESS",
  REVOKE_COACHING_SESSION_FAILURE = "REVOKE_COACHING_SESSION_FAILURE",
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

export const revokeCoachingSession = createAction(
  ActionTypesEnum.REVOKE_COACHING_SESSION,
)<{ userUuid: string }>();

export const revokeCoachingSessionSuccess = createAction(
  ActionTypesEnum.REVOKE_COACHING_SESSION_SUCCESS,
)<{ userUuid: string }>();

export const revokeCoachingSessionFailure = createAction(
  ActionTypesEnum.REVOKE_COACHING_SESSION_FAILURE,
)<HttpResponseError>();
