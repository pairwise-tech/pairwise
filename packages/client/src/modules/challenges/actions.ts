import {
  Course,
  CourseSkeletonList,
  ICodeBlobDto,
  IProgressDto,
} from "@pairwise/common";
import { createAction } from "typesafe-actions";
import {
  ChallengeCreationPayload,
  ChallengeUpdatePayload,
  InverseChallengeMapping,
  ModuleCreationPayload,
  ModuleUpdatePayload,
  ModuleDeletePayload,
  ChallengeDeletePayload,
  ChallengeReorderPayload,
  ModuleReorderPayload,
} from "./types";
import { HttpResponseError } from "modules/api";
import { ADMIN_EDITOR_TAB, ADMIN_TEST_TAB } from "./store";

/** ===========================================================================
 * Action Types
 * ============================================================================
 */

enum ActionTypesEnum {
  SET_CHALLENGE_ID = "SET_CHALLENGE_ID",
  SET_ANY_SYNC_CHALLENGE_ID = "SET_ANY_SYNC_CHALLENGE_ID",
  WORKSPACE_CHALLENGE_LOADED = "WORKSPACE_CHALLENGE_LOADED",

  SET_ACTIVE_CHALLENGE_IDS = "SET_ACTIVE_CHALLENGE_IDS",

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
  DELETE_CHALLENGE = "DELETE_CHALLENGE",

  REORDER_CHALLENGE_LIST = "REORDER_CHALLENGE_LIST",

  CREATE_MODULE = "CREATE_MODULE",
  UPDATE_MODULE = "UPDATE_MODULE",
  DELETE_MODULE = "DELETE_MODULE",

  REORDER_MODULE_LIST = "REORDER_MODULE_LIST",

  UPDATE_EDITOR_OPTIONS = "UPDATE_EDITOR_OPTIONS",

  FETCH_BLOB_FOR_CHALLENGE = "FETCH_BLOB_FOR_CHALLENGE",
  FETCH_BLOB_FOR_CHALLENGE_SUCCESS = "FETCH_BLOB_FOR_CHALLENGE_SUCCESS",
  FETCH_BLOB_FOR_CHALLENGE_FAILURE = "FETCH_BLOB_FOR_CHALLENGE_FAILURE",

  CHALLENGE_COMPLETED = "CHALLENGE_COMPLETED",

  UPDATE_USER_PROGRESS = "UPDATE_USER_PROGRESS",
  UPDATE_USER_PROGRESS_SUCCESS = "UPDATE_USER_PROGRESS_SUCCESS",
  UPDATE_USER_PROGRESS_FAILURE = "UPDATE_USER_PROGRESS_FAILURE",

  UPDATE_CURRENT_CHALLENGE_BLOB = "UPDATE_CURRENT_CHALLENGE_BLOB",
  SAVE_CHALLENGE_BLOB = "SAVE_CHALLENGE_BLOB",
  SAVE_CHALLENGE_BLOB_SUCCESS = "SAVE_CHALLENGE_BLOB_SUCCESS",
  SAVE_CHALLENGE_BLOB_FAILURE = "SAVE_CHALLENGE_BLOB_FAILURE",

  SET_ADMIN_TEST_TAB = "SET_ADMIN_TEST_TAB",
  SET_ADMIN_EDITOR_TAB = "SET_ADMIN_EDITOR_TAB",

  TOGGLE_SECTION_ACCORDION_VIEW = "TOGGLE_SECTION_ACCORDION_VIEW",
}

/** ===========================================================================
 * Actions
 * ============================================================================
 */

export const setEditMode = createAction(ActionTypesEnum.SET_EDIT_MODE)<
  boolean
>();

export const setAdminTestTab = createAction(ActionTypesEnum.SET_ADMIN_TEST_TAB)<
  ADMIN_TEST_TAB
>();

export const setAdminEditorTab = createAction(
  ActionTypesEnum.SET_ADMIN_EDITOR_TAB,
)<ADMIN_EDITOR_TAB>();

export const setAndSyncChallengeId = createAction(
  ActionTypesEnum.SET_ANY_SYNC_CHALLENGE_ID,
)<{
  currentChallengeId: string;
  previousChallengeId: string;
}>();

/**
 * NOTE: This action is used primarily within Redux state updates to
 * communicate the challenge id changing.
 */
export const setChallengeId = createAction(ActionTypesEnum.SET_CHALLENGE_ID)<{
  currentChallengeId: string;
  previousChallengeId: string;
}>();

/**
 * NOTE: The canonical way to "set" a new challenge id is to navigate to it.
 * The url is the source of truth for the current challenge. To programmatically
 * select a new challenge, you can use the following action, which will result
 * in the routing side effect occurring via an epic. Good luck!
 */
export const fetchBlobForChallenge = createAction(
  ActionTypesEnum.FETCH_BLOB_FOR_CHALLENGE,
)<string>();

export const fetchBlobForChallengeSuccess = createAction(
  ActionTypesEnum.FETCH_BLOB_FOR_CHALLENGE_SUCCESS,
)<ICodeBlobDto>();

export const fetchBlobForChallengeFailure = createAction(
  ActionTypesEnum.FETCH_BLOB_FOR_CHALLENGE_FAILURE,
)<HttpResponseError>();

export const handleCompleteChallenge = createAction(
  ActionTypesEnum.CHALLENGE_COMPLETED,
)<string>();

export const updateUserProgress = createAction(
  ActionTypesEnum.UPDATE_USER_PROGRESS,
)<IProgressDto>();

export const updateUserProgressSuccess = createAction(
  ActionTypesEnum.UPDATE_USER_PROGRESS_SUCCESS,
)();

export const updateUserProgressFailure = createAction(
  ActionTypesEnum.UPDATE_USER_PROGRESS_FAILURE,
)<HttpResponseError>();

export const updateCurrentChallengeBlob = createAction(
  ActionTypesEnum.UPDATE_CURRENT_CHALLENGE_BLOB,
)<ICodeBlobDto>();

export const saveChallengeBlob = createAction(
  ActionTypesEnum.SAVE_CHALLENGE_BLOB,
)<ICodeBlobDto>();

export const saveChallengeBlobSuccess = createAction(
  ActionTypesEnum.SAVE_CHALLENGE_BLOB_SUCCESS,
)();

export const saveChallengeBlobFailure = createAction(
  ActionTypesEnum.SAVE_CHALLENGE_BLOB_FAILURE,
)<HttpResponseError>();

export const setCurrentModule = createAction(ActionTypesEnum.SET_MODULE_ID)<
  string
>();

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

export const setNavigationMapState = createAction(
  ActionTypesEnum.SET_NAVIGATION_MAP_STATE,
)<boolean>();

export const setActiveChallengeIds = createAction(
  ActionTypesEnum.SET_ACTIVE_CHALLENGE_IDS,
)<{
  currentModuleId: string;
  currentCourseId: string;
  currentChallengeId: string;
}>();

export const fetchCurrentActiveCourseSuccess = createAction(
  ActionTypesEnum.FETCH_CURRENT_ACTIVE_COURSE_SUCCESS,
)<{
  courses: Course[];
  currentModuleId: string;
  currentCourseId: string;
  currentChallengeId: string;
}>();

export const fetchCurrentActiveCourseFailure = createAction(
  ActionTypesEnum.FETCH_CURRENT_ACTIVE_COURSE_FAILURE,
)();

export const storeInverseChallengeMapping = createAction(
  ActionTypesEnum.STORE_INVERSE_CHALLENGE_MAP,
)<InverseChallengeMapping>();

export const saveCourse = createAction(ActionTypesEnum.SAVE_COURSE)<Course>();
export const saveCourseSuccess = createAction(
  ActionTypesEnum.SAVE_COURSE_SUCCESS,
)();
export const saveCourseFailure = createAction(
  ActionTypesEnum.SAVE_COURSE_FAILURE,
)<any>();

export const createChallenge = createAction(ActionTypesEnum.CREATE_CHALLENGE)<
  ChallengeCreationPayload
>();

export const updateChallenge = createAction(ActionTypesEnum.UPDATE_CHALLENGE)<
  ChallengeUpdatePayload
>();

export const deleteChallenge = createAction(ActionTypesEnum.DELETE_CHALLENGE)<
  ChallengeDeletePayload
>();

export const reorderChallengeList = createAction(
  ActionTypesEnum.REORDER_CHALLENGE_LIST,
)<ChallengeReorderPayload>();

export const createCourseModule = createAction(ActionTypesEnum.CREATE_MODULE)<
  ModuleCreationPayload
>();

export const updateCourseModule = createAction(ActionTypesEnum.UPDATE_MODULE)<
  ModuleUpdatePayload
>();

export const deleteCourseModule = createAction(ActionTypesEnum.DELETE_MODULE)<
  ModuleDeletePayload
>();

export const reorderModuleList = createAction(
  ActionTypesEnum.REORDER_MODULE_LIST,
)<ModuleReorderPayload>();

export const toggleSectionAccordionView = createAction(
  ActionTypesEnum.TOGGLE_SECTION_ACCORDION_VIEW,
)<{ sectionId: string; open: boolean }>();
