import { IUserDto, UserUpdateOptions } from "@pairwise/common";
import { HttpResponseError } from "modules/api";
import { ActionType, createAction } from "typesafe-actions";
import { UserStoreState } from "./store";

/** ===========================================================================
 * Action Types
 * ============================================================================
 */

enum ActionTypesEnum {
  FETCH_USER = "FETCH_USER",
  FETCH_USER_SUCCESS = "FETCH_USER_SUCCESS",
  FETCH_USER_FAILURE = "FETCH_USER_FAILURE",

  UPDATE_USER = "UPDATE_USER",
  UPDATE_USER_SUCCESS = "UPDATE_USER_SUCCESS",
  UPDATE_USER_FAILURE = "UPDATE_USER_FAILURE",
}

/** ===========================================================================
 * Actions
 * ============================================================================
 */

const fetchUser = createAction(ActionTypesEnum.FETCH_USER)();
const fetchUserSuccess = createAction(ActionTypesEnum.FETCH_USER_SUCCESS)<
  UserStoreState
>();
const fetchUserFailure = createAction(ActionTypesEnum.FETCH_USER_FAILURE)<
  HttpResponseError
>();

const updateUser = createAction(ActionTypesEnum.UPDATE_USER)<
  UserUpdateOptions
>();
const updateUserSuccess = createAction(ActionTypesEnum.UPDATE_USER_SUCCESS)<
  IUserDto
>();
const updateUserFailure = createAction(ActionTypesEnum.UPDATE_USER_FAILURE)<
  HttpResponseError
>();

const actions = {
  fetchUser,
  fetchUserSuccess,
  fetchUserFailure,
  updateUser,
  updateUserSuccess,
  updateUserFailure,
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export type ActionTypes = ActionType<typeof actions>;

export default actions;
