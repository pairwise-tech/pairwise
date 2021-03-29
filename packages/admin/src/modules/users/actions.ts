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

  EMAIL_MIGRATION = "EMAIL_MIGRATION",
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

export const emailMigration = createAction(ActionTypesEnum.EMAIL_MIGRATION)();
