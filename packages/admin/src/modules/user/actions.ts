import { HttpResponseError } from "modules/api";
import { createAction } from "typesafe-actions";
import { UserStoreState } from "./store";

/** ===========================================================================
 * Action Types
 * ============================================================================
 */

enum ActionTypesEnum {
  FETCH_USER = "FETCH_USER",
  FETCH_USER_SUCCESS = "FETCH_USER_SUCCESS",
  FETCH_USER_FAILURE = "FETCH_USER_FAILURE",

  ADMIN_USER_LOGIN = "ADMIN_USER_LOGIN",
  ADMIN_USER_LOGIN_SUCCESS = "ADMIN_USER_LOGIN_SUCCESS",
  ADMIN_USER_LOGIN_FAILURE = "ADMIN_USER_LOGIN_FAILURE",
}

/** ===========================================================================
 * Actions
 * ============================================================================
 */

export const fetchUser = createAction(ActionTypesEnum.FETCH_USER)();

export const fetchUserSuccess = createAction(
  ActionTypesEnum.FETCH_USER_SUCCESS,
)<UserStoreState>();

export const fetchUserFailure = createAction(
  ActionTypesEnum.FETCH_USER_FAILURE,
)<HttpResponseError>();
