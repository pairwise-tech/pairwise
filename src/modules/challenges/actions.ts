import { ActionType, createAction } from "typesafe-actions";

import { CourseList } from "./types";

/** ===========================================================================
 * Action Types
 * ============================================================================
 */

enum ActionTypesEnum {
  SET_CHALLENGE_ID = "SET_CHALLENGE_ID",
  WORKSPACE_CHALLENGE_LOADED = "WORKSPACE_CHALLENGE_LOADED",

  SET_NAVIGATION_MAP_STATE = "SET_NAVIGATION_MAP_STATE",

  FETCH_NAVIGATION_SKELETON_SUCCESS = "FETCH_NAVIGATION_SKELETON_SUCCESS",
  FETCH_CURRENT_ACTIVE_COURSE_SUCCESS = "FETCH_CURRENT_ACTIVE_COURSE_SUCCESS",
}

/** ===========================================================================
 * Actions
 * ============================================================================
 */

const setChallengeId = createAction(ActionTypesEnum.SET_CHALLENGE_ID)<string>();

const setWorkspaceChallengeLoaded = createAction(
  ActionTypesEnum.WORKSPACE_CHALLENGE_LOADED,
)();

const fetchNavigationSkeletonSuccess = createAction(
  ActionTypesEnum.FETCH_NAVIGATION_SKELETON_SUCCESS,
)<CourseList>();

const setNavigationMapState = createAction(
  ActionTypesEnum.SET_NAVIGATION_MAP_STATE,
)<boolean>();

const fetchCurrentActiveCourseSuccess = createAction(
  ActionTypesEnum.FETCH_CURRENT_ACTIVE_COURSE_SUCCESS,
)<{
  courses: CourseList;
  currentModuleId: string;
  currentCourseId: string;
  currentChallengeId: string;
}>();

const actions = {
  setChallengeId,
  setNavigationMapState,
  setWorkspaceChallengeLoaded,
  fetchNavigationSkeletonSuccess,
  fetchCurrentActiveCourseSuccess,
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export type ActionTypes = ActionType<typeof actions>;

export default actions;
