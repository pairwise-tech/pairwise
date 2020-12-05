import {
  Course,
  CourseSkeletonList,
} from "@pairwise/common";
import { createAction } from "typesafe-actions";
import {
  InverseChallengeMapping,
} from "./types";
import { HttpResponseError } from "modules/api";

/** ===========================================================================
 * Action Types
 * ============================================================================
 */

enum ActionTypesEnum {
  WORKSPACE_CHALLENGE_LOADED = "WORKSPACE_CHALLENGE_LOADED",

  SET_CHALLENGE_ID_CONTEXT = "SET_CHALLENGE_ID_CONTEXT",

  FETCH_NAVIGATION_SKELETON = "FETCH_NAVIGATION_SKELETON",
  FETCH_NAVIGATION_SKELETON_SUCCESS = "FETCH_NAVIGATION_SKELETON_SUCCESS",
  FETCH_NAVIGATION_SKELETON_FAILURE = "FETCH_NAVIGATION_SKELETON_FAILURE",

  FETCH_COURSES_SUCCESS = "FETCH_COURSES_SUCCESS",
  FETCH_COURSES_FAILURE = "FETCH_COURSES_FAILURE",

  STORE_INVERSE_CHALLENGE_MAP = "STORE_INVERSE_CHALLENGE_MAP",
}

/** ===========================================================================
 * Actions
 * ============================================================================
 */

export const setWorkspaceChallengeLoaded = createAction(
  ActionTypesEnum.WORKSPACE_CHALLENGE_LOADED,
)();

export const fetchNavigationSkeleton = createAction(
  ActionTypesEnum.FETCH_NAVIGATION_SKELETON,
)();

export const fetchNavigationSkeletonSuccess = createAction(
  ActionTypesEnum.FETCH_NAVIGATION_SKELETON_SUCCESS,
)<CourseSkeletonList>();

export const fetchNavigationSkeletonFailure = createAction(
  ActionTypesEnum.FETCH_NAVIGATION_SKELETON_FAILURE,
)<HttpResponseError>();

export const setChallengeIdContext = createAction(
  ActionTypesEnum.SET_CHALLENGE_ID_CONTEXT,
)<{
  currentModuleId: string;
  currentCourseId: string;
  currentChallengeId: Nullable<string>;
  previousChallengeId: Nullable<string>;
}>();

export const fetchCoursesSuccess = createAction(
  ActionTypesEnum.FETCH_COURSES_SUCCESS,
)<{ courses: Course[] }>();

export const fetchCoursesFailure = createAction(
  ActionTypesEnum.FETCH_COURSES_FAILURE,
)();

export const storeInverseChallengeMapping = createAction(
  ActionTypesEnum.STORE_INVERSE_CHALLENGE_MAP,
)<InverseChallengeMapping>();
