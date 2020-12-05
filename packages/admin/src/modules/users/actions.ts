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
