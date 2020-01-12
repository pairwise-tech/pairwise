import { Course, CourseSkeletonList } from "@pairwise/common";
import { ActionType, createAction } from "typesafe-actions";
import {
  ChallengeCreationPayload,
  ChallengeUpdatePayload,
  InverseChallengeMapping,
  ModuleCreationPayload,
  ModuleUpdatePayload,
  MonacoEditorOptions,
} from "./types";
import { HttpResponseError } from "modules/api";

/** ===========================================================================
 * Action Types
 * ============================================================================
 */

enum ActionTypesEnum {
  SET_CHALLENGE_ID = "SET_CHALLENGE_ID",
  WORKSPACE_CHALLENGE_LOADED = "WORKSPACE_CHALLENGE_LOADED",

  SET_MODULE_ID = "SET_MODULE_ID",

  SET_NAVIGATION_MAP_STATE = "SET_NAVIGATION_MAP_STATE",

  FETCH_NAVIGATION_SKELETON = "FETCH_NAVIGATION_SKELETON",
  FETCH_NAVIGATION_SKELETON_SUCCESS = "FETCH_NAVIGATION_SKELETON_SUCCESS",
  FETCH_NAVIGATION_SKELETON_FAILURE = "FETCH_NAVIGATION_SKELETON_FAILURE",

  FETCH_CURRENT_ACTIVE_COURSE_SUCCESS = "FETCH_CURRENT_ACTIVE_COURSE_SUCCESS",
  FETCH_CURRENT_ACTIVE_COURSE_FAILURE = "FETCH_CURRENT_ACTIVE_COURSE_FAILURE",

  SET_EDIT_MODE = "SET_EDIT_MODE",

  STORE_INVERSE_CHALLENGE_MAP = "STORE_INVERSE_CHALLENGE_MAP",

  SAVE_COURSE = "SAVE_COURSE",
  SAVE_COURSE_SUCCESS = "SAVE_COURSE_SUCCESS",
  SAVE_COURSE_FAILURE = "SAVE_COURSE_FAILURE",

  CREATE_CHALLENGE = "CREATE_CHALLENGE",
  UPDATE_CHALLENGE = "UPDATE_CHALLENGE",
  REMOVE_CHALLENGE = "REMOVE_CHALLENGE",

  CREATE_MODULE = "CREATE_MODULE",
  UPDATE_MODULE = "UPDATE_MODULE",
  REMOVE_MODULE = "REMOVE_MODULE",

  UPDATE_EDITOR_OPTIONS = "UPDATE_EDITOR_OPTIONS",
}

/** ===========================================================================
 * Actions
 * ============================================================================
 */

const setEditMode = createAction(ActionTypesEnum.SET_EDIT_MODE)<boolean>();

const setChallengeId = createAction(ActionTypesEnum.SET_CHALLENGE_ID)<string>();

const setCurrentModule = createAction(ActionTypesEnum.SET_MODULE_ID)<string>();

const setWorkspaceChallengeLoaded = createAction(
  ActionTypesEnum.WORKSPACE_CHALLENGE_LOADED,
)();

const fetchNavigationSkeleton = createAction(
  ActionTypesEnum.FETCH_NAVIGATION_SKELETON,
)();

const fetchNavigationSkeletonSuccess = createAction(
  ActionTypesEnum.FETCH_NAVIGATION_SKELETON_SUCCESS,
)<CourseSkeletonList>();

const fetchNavigationSkeletonFailure = createAction(
  ActionTypesEnum.FETCH_NAVIGATION_SKELETON_FAILURE,
)<HttpResponseError>();

const setNavigationMapState = createAction(
  ActionTypesEnum.SET_NAVIGATION_MAP_STATE,
)<boolean>();

const fetchCurrentActiveCourseSuccess = createAction(
  ActionTypesEnum.FETCH_CURRENT_ACTIVE_COURSE_SUCCESS,
)<{
  courses: Course[];
  currentModuleId: string;
  currentCourseId: string;
  currentChallengeId: string;
}>();

const fetchCurrentActiveCourseFailure = createAction(
  ActionTypesEnum.FETCH_CURRENT_ACTIVE_COURSE_FAILURE,
)();

const storeInverseChallengeMapping = createAction(
  ActionTypesEnum.STORE_INVERSE_CHALLENGE_MAP,
)<InverseChallengeMapping>();

const saveCourse = createAction(ActionTypesEnum.SAVE_COURSE)<Course>();
const saveCourseSuccess = createAction(ActionTypesEnum.SAVE_COURSE_SUCCESS)();
const saveCourseFailure = createAction(ActionTypesEnum.SAVE_COURSE_FAILURE)<
  any
>();

const createChallenge = createAction(ActionTypesEnum.CREATE_CHALLENGE)<
  ChallengeCreationPayload
>();

const updateChallenge = createAction(ActionTypesEnum.UPDATE_CHALLENGE)<
  ChallengeUpdatePayload
>();

const removeChallenge = createAction(ActionTypesEnum.REMOVE_CHALLENGE)<
  string
>();

const createCourseModule = createAction(ActionTypesEnum.CREATE_MODULE)<
  ModuleCreationPayload
>();

const updateCourseModule = createAction(ActionTypesEnum.UPDATE_MODULE)<
  ModuleUpdatePayload
>();

const updateEditorOptions = createAction(ActionTypesEnum.UPDATE_EDITOR_OPTIONS)<
  Partial<MonacoEditorOptions>
>();

const actions = {
  updateEditorOptions,
  setCurrentModule,
  saveCourse,
  saveCourseSuccess,
  saveCourseFailure,
  createCourseModule,
  updateCourseModule,
  createChallenge,
  updateChallenge,
  removeChallenge,
  storeInverseChallengeMapping,
  setEditMode,
  setChallengeId,
  setNavigationMapState,
  setWorkspaceChallengeLoaded,
  fetchNavigationSkeleton,
  fetchNavigationSkeletonSuccess,
  fetchNavigationSkeletonFailure,
  fetchCurrentActiveCourseSuccess,
  fetchCurrentActiveCourseFailure,
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export type ActionTypes = ActionType<typeof actions>;

export default actions;
