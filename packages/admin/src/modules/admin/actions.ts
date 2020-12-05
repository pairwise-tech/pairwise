import { HttpResponseError } from "modules/api";
import { createAction } from "typesafe-actions";
import { UserStoreState } from "./store";

/** ===========================================================================
 * Action Types
 * ============================================================================
 */

enum ActionTypesEnum {
  FETCH_ADMIN_USER = "FETCH_ADMIN_USER",
  FETCH_ADMIN_USER_SUCCESS = "FETCH_ADMIN_USER_SUCCESS",
  FETCH_ADMIN_USER_FAILURE = "FETCH_ADMIN_USER_FAILURE",

  ADMIN_ADMIN_USER_LOGIN = "ADMIN_ADMIN_USER_LOGIN",
  ADMIN_ADMIN_USER_LOGIN_SUCCESS = "ADMIN_ADMIN_USER_LOGIN_SUCCESS",
  ADMIN_ADMIN_USER_LOGIN_FAILURE = "ADMIN_ADMIN_USER_LOGIN_FAILURE",
}

/** ===========================================================================
 * Actions
 * ============================================================================
 */

export const fetchAdminUser = createAction(ActionTypesEnum.FETCH_ADMIN_USER)();

export const fetchAdminUserSuccess = createAction(
  ActionTypesEnum.FETCH_ADMIN_USER_SUCCESS,
)<UserStoreState>();

export const fetchAdminUserFailure = createAction(
  ActionTypesEnum.FETCH_ADMIN_USER_FAILURE,
)<HttpResponseError>();
