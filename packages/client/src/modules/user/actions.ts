import { HttpResponseError } from "modules/api";
import { ActionType, createAction } from "typesafe-actions";
import { User } from "./types";

/** ===========================================================================
 * Action Types
 * ============================================================================
 */

enum ActionTypesEnum {
  FETCH_USER = "FETCH_USER",
  FETCH_USER_SUCCESS = "FETCH_USER_SUCCESS",
  FETCH_USER_FAILURE = "FETCH_USER_FAILURE",

  UPDATE_USER = "UPDATE_USER",
}

/** ===========================================================================
 * Actions
 * ============================================================================
 */

const fetchUser = createAction(ActionTypesEnum.FETCH_USER)();
const fetchUserSuccess = createAction(ActionTypesEnum.FETCH_USER_SUCCESS)<
  User
>();
const fetchUserFailure = createAction(ActionTypesEnum.FETCH_USER_FAILURE)<
  HttpResponseError
>();

const updateUser = createAction(ActionTypesEnum.UPDATE_USER)();

const actions = {
  fetchUser,
  updateUser,
  fetchUserSuccess,
  fetchUserFailure,
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export type ActionTypes = ActionType<typeof actions>;

export default actions;
