import {
  Course,
  CourseSkeletonList,
  InverseChallengeMapping,
} from "@pairwise/common";
import { createAction } from "typesafe-actions";
import { HttpResponseError } from "modules/api";
import { PullRequestContext } from "./store";

/** ===========================================================================
 * Action Types
 * ============================================================================
 */

enum ActionTypesEnum {
  SET_NAVIGATION_MAP_STATE = "SET_NAVIGATION_MAP_STATE",

  FETCH_NAVIGATION_SKELETON = "FETCH_NAVIGATION_SKELETON",
  FETCH_NAVIGATION_SKELETON_SUCCESS = "FETCH_NAVIGATION_SKELETON_SUCCESS",
  FETCH_NAVIGATION_SKELETON_FAILURE = "FETCH_NAVIGATION_SKELETON_FAILURE",

  FETCH_COURSES_SUCCESS = "FETCH_COURSES_SUCCESS",
  FETCH_COURSES_FAILURE = "FETCH_COURSES_FAILURE",

  STORE_INVERSE_CHALLENGE_MAP = "STORE_INVERSE_CHALLENGE_MAP",

  SET_MENU_ITEM_SELECT_INDEX = "SET_MENU_ITEM_SELECT_INDEX",

  SET_CHALLENGE_DETAIL_ID = "SET_CHALLENGE_DETAIL_ID",

  HANDLE_FETCH_PULL_REQUEST_CONTEXT = "HANDLE_FETCH_PULL_REQUEST_CONTEXT",

  FETCH_PULL_REQUEST_CONTEXT = "FETCH_PULL_REQUEST_CONTEXT",
  FETCH_PULL_REQUEST_CONTEXT_SUCCESS = "FETCH_PULL_REQUEST_CONTEXT_SUCCESS",
  FETCH_PULL_REQUEST_CONTEXT_FAILURE = "FETCH_PULL_REQUEST_CONTEXT_FAILURE",
}

/** ===========================================================================
 * Actions
 * ============================================================================
 */

export const fetchNavigationSkeleton = createAction(
  ActionTypesEnum.FETCH_NAVIGATION_SKELETON,
)();

export const fetchNavigationSkeletonSuccess = createAction(
  ActionTypesEnum.FETCH_NAVIGATION_SKELETON_SUCCESS,
)<CourseSkeletonList>();

export const fetchNavigationSkeletonFailure = createAction(
  ActionTypesEnum.FETCH_NAVIGATION_SKELETON_FAILURE,
)<HttpResponseError>();

export const fetchCoursesSuccess = createAction(
  ActionTypesEnum.FETCH_COURSES_SUCCESS,
)<{ courses: Course[] }>();

export const fetchCoursesFailure = createAction(
  ActionTypesEnum.FETCH_COURSES_FAILURE,
)();

export const storeInverseChallengeMapping = createAction(
  ActionTypesEnum.STORE_INVERSE_CHALLENGE_MAP,
)<InverseChallengeMapping>();

export const setNavigationMapState = createAction(
  ActionTypesEnum.SET_NAVIGATION_MAP_STATE,
)<boolean>();

export const setMenuItemSelectIndex = createAction(
  ActionTypesEnum.SET_MENU_ITEM_SELECT_INDEX,
)<number>();

export const setChallengeDetailId = createAction(
  ActionTypesEnum.SET_CHALLENGE_DETAIL_ID,
)<Nullable<string>>();

export const handleSearchPullRequest = createAction(
  ActionTypesEnum.HANDLE_FETCH_PULL_REQUEST_CONTEXT,
)<string>();

export const fetchPullRequestContext = createAction(
  ActionTypesEnum.FETCH_PULL_REQUEST_CONTEXT,
)<number>();

export const fetchPullRequestContextSuccess = createAction(
  ActionTypesEnum.FETCH_PULL_REQUEST_CONTEXT_SUCCESS,
)<PullRequestContext[]>();

export const fetchPullRequestContextFailure = createAction(
  ActionTypesEnum.FETCH_PULL_REQUEST_CONTEXT_FAILURE,
)<HttpResponseError>();
