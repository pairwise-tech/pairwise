import {
  Course,
  CourseSkeletonList,
  ICodeBlobDto,
  IProgressDto,
  LastActiveChallengeIds,
  InverseChallengeMapping,
  Challenge,
  CHALLENGE_TYPE,
  PullRequestCourseContent,
} from "@pairwise/common";
import { createAction } from "typesafe-actions";
import {
  ChallengeCreationPayload,
  ChallengeUpdatePayload,
  ModuleCreationPayload,
  ModuleUpdatePayload,
  ModuleDeletePayload,
  ChallengeDeletePayload,
  ChallengeReorderPayload,
  ModuleReorderPayload,
  SearchResult,
} from "./types";
import { HttpResponseError } from "modules/api";
import { ADMIN_EDITOR_TAB, ADMIN_TEST_TAB, MENU_SELECT_COLUMN } from "./store";

/** ===========================================================================
 * Action Types
 * ============================================================================
 */

enum ActionTypesEnum {
  WORKSPACE_CHALLENGE_LOADED = "WORKSPACE_CHALLENGE_LOADED",

  SET_CHALLENGE_ID_CONTEXT = "SET_CHALLENGE_ID_CONTEXT",

  UPDATE_LAST_ACTIVE_CHALLENGE_IDS = "UPDATE_LAST_ACTIVE_CHALLENGE_IDS",
  UPDATE_LAST_ACTIVE_CHALLENGE_IDS_SUCCESS = "UPDATE_LAST_ACTIVE_CHALLENGE_IDS_SUCCESS",
  UPDATE_LAST_ACTIVE_CHALLENGE_IDS_FAILURE = "UPDATE_LAST_ACTIVE_CHALLENGE_IDS_FAILURE",

  SET_MODULE_ID = "SET_MODULE_ID",
  SET_COURSE_ID = "SET_COURSE_ID",

  SET_NAVIGATION_OVERLAY_MODULE_ID = "SET_NAVIGATION_OVERLAY_MODULE_ID",
  SET_NAVIGATION_OVERLAY_COURSE_ID = "SET_NAVIGATION_OVERLAY_COURSE_ID",

  SET_NAVIGATION_MAP_STATE = "SET_NAVIGATION_MAP_STATE",

  SUBMIT_PROJECT = "SUBMIT_PROJECT",

  FETCH_NAVIGATION_SKELETON = "FETCH_NAVIGATION_SKELETON",
  FETCH_NAVIGATION_SKELETON_SUCCESS = "FETCH_NAVIGATION_SKELETON_SUCCESS",
  FETCH_NAVIGATION_SKELETON_FAILURE = "FETCH_NAVIGATION_SKELETON_FAILURE",

  FETCH_COURSES = "FETCH_COURSES",
  FETCH_COURSES_SUCCESS = "FETCH_COURSES_SUCCESS",
  FETCH_COURSES_FAILURE = "FETCH_COURSES_FAILURE",

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

  CHALLENGE_ATTEMPTED = "CHALLENGE_ATTEMPTED",

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

  TOGGLE_REVEAL_SOLUTION = "TOGGLE_REVEAL_SOLUTION",

  TOGGLE_EDIT_MODE_ALTERNATIVE_VIEW = "TOGGLE_EDIT_MODE_ALTERNATIVE_VIEW",

  // NOTE: These don't follow the pattern of do_something{,_success,_failure}
  // because they are worker related so there is no direct tie between one
  // search action and it's result at the epic level. This is not yet a
  // convention though so I'm open to suggestions
  REQUEST_SEARCH_RESULTS = "REQUEST_SEARCH_RESULTS",
  RECEIVE_SEARCH_RESULTS = "RECEIVE_SEARCH_RESULTS",

  SET_MENU_SELECT_COLUMN = "SET_MENU_SELECT_COLUMN",
  SET_MENU_SELECT_INDEX = "SET_MENU_SELECT_INDEX",

  TOGGLE_CODEMIRROR_EDITOR = "TOGGLE_CODEMIRROR_EDITOR",

  TOGGLE_INSTRUCTIONS_VIEW = "TOGGLE_INSTRUCTIONS_VIEW",

  SET_DEEP_LINK_CODE_STRING = "SET_DEEP_LINK_CODE_STRING",

  LOAD_PULL_REQUEST_COURSE_LIST = "LOAD_PULL_REQUEST_COURSE_LIST",
  LOAD_PULL_REQUEST_COURSE_LIST_SUCCESS = "LOAD_PULL_REQUEST_COURSE_LIST_SUCCESS",
  LOAD_PULL_REQUEST_COURSE_LIST_FAILURE = "LOAD_PULL_REQUEST_COURSE_LIST_FAILURE",

  RESET_PULL_REQUEST_STATE = "RESET_PULL_REQUEST_STATE",

  SET_CHALLENGE_INSTRUCTIONS_MODAL_STATE = "SET_CHALLENGE_INSTRUCTIONS_MODAL_STATE",
}

/** ===========================================================================
 * Actions
 * ============================================================================
 */

export const requestSearchResults = createAction(
  ActionTypesEnum.REQUEST_SEARCH_RESULTS,
)<string>();

// TODO: Once I have a firm search result type add it here
export const receiveSearchResults = createAction(
  ActionTypesEnum.RECEIVE_SEARCH_RESULTS,
)<SearchResult[]>();

export const setEditMode = createAction(
  ActionTypesEnum.SET_EDIT_MODE,
)<boolean>();

export const setAdminTestTab = createAction(
  ActionTypesEnum.SET_ADMIN_TEST_TAB,
)<ADMIN_TEST_TAB>();

export const setAdminEditorTab = createAction(
  ActionTypesEnum.SET_ADMIN_EDITOR_TAB,
)<ADMIN_EDITOR_TAB>();

export const fetchBlobForChallenge = createAction(
  ActionTypesEnum.FETCH_BLOB_FOR_CHALLENGE,
)<string>();

export const fetchBlobForChallengeSuccess = createAction(
  ActionTypesEnum.FETCH_BLOB_FOR_CHALLENGE_SUCCESS,
)<ICodeBlobDto>();

export const fetchBlobForChallengeFailure = createAction(
  ActionTypesEnum.FETCH_BLOB_FOR_CHALLENGE_FAILURE,
)<{ challengeId: string; err: HttpResponseError }>();

export const handleAttemptChallenge = createAction(
  ActionTypesEnum.CHALLENGE_ATTEMPTED,
)<{ challengeId: string; complete: boolean }>();

export const updateUserProgress = createAction(
  ActionTypesEnum.UPDATE_USER_PROGRESS,
)<IProgressDto>();

export const updateUserProgressSuccess = createAction(
  ActionTypesEnum.UPDATE_USER_PROGRESS_SUCCESS,
)<IProgressDto>();

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

export const setCurrentCourse = createAction(
  ActionTypesEnum.SET_COURSE_ID,
)<string>();

export const setCurrentModule = createAction(
  ActionTypesEnum.SET_MODULE_ID,
)<string>();

export const setNavigationOverlayCurrentCourse = createAction(
  ActionTypesEnum.SET_NAVIGATION_OVERLAY_COURSE_ID,
)<string>();

export const setNavigationOverlayCurrentModule = createAction(
  ActionTypesEnum.SET_NAVIGATION_OVERLAY_MODULE_ID,
)<string>();

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

export const submitProject = createAction(
  ActionTypesEnum.SUBMIT_PROJECT,
)<Challenge>();

export const setChallengeIdContext = createAction(
  ActionTypesEnum.SET_CHALLENGE_ID_CONTEXT,
)<{
  currentModuleId: string;
  currentCourseId: string;
  currentChallengeId: Nullable<string>;
  previousChallengeId: Nullable<string>;
}>();

export const updateLastActiveChallengeIds = createAction(
  ActionTypesEnum.UPDATE_LAST_ACTIVE_CHALLENGE_IDS,
)<{ challengeId: string }>();

export const updateLastActiveChallengeIdsSuccess = createAction(
  ActionTypesEnum.UPDATE_LAST_ACTIVE_CHALLENGE_IDS_SUCCESS,
)<LastActiveChallengeIds>();

export const updateLastActiveChallengeIdsFailure = createAction(
  ActionTypesEnum.UPDATE_LAST_ACTIVE_CHALLENGE_IDS_FAILURE,
)();

export const fetchCourses = createAction(ActionTypesEnum.FETCH_COURSES)();

export const fetchCoursesSuccess = createAction(
  ActionTypesEnum.FETCH_COURSES_SUCCESS,
)<{ courses: Course[] }>();

export const fetchCoursesFailure = createAction(
  ActionTypesEnum.FETCH_COURSES_FAILURE,
)<HttpResponseError>();

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

export const createChallenge = createAction(
  ActionTypesEnum.CREATE_CHALLENGE,
)<ChallengeCreationPayload>();

export const updateChallenge = createAction(
  ActionTypesEnum.UPDATE_CHALLENGE,
)<ChallengeUpdatePayload>();

export const deleteChallenge = createAction(
  ActionTypesEnum.DELETE_CHALLENGE,
)<ChallengeDeletePayload>();

export const reorderChallengeList = createAction(
  ActionTypesEnum.REORDER_CHALLENGE_LIST,
)<ChallengeReorderPayload>();

export const createCourseModule = createAction(
  ActionTypesEnum.CREATE_MODULE,
)<ModuleCreationPayload>();

export const updateCourseModule = createAction(
  ActionTypesEnum.UPDATE_MODULE,
)<ModuleUpdatePayload>();

export const deleteCourseModule = createAction(
  ActionTypesEnum.DELETE_MODULE,
)<ModuleDeletePayload>();

export const reorderModuleList = createAction(
  ActionTypesEnum.REORDER_MODULE_LIST,
)<ModuleReorderPayload>();

export const toggleSectionAccordionView = createAction(
  ActionTypesEnum.TOGGLE_SECTION_ACCORDION_VIEW,
)<{ sectionId: string; open: boolean }>();

export const toggleRevealSolutionCode = createAction(
  ActionTypesEnum.TOGGLE_REVEAL_SOLUTION,
)<{ shouldReveal: boolean }>();

export const toggleEditModeAlternativeView = createAction(
  ActionTypesEnum.TOGGLE_EDIT_MODE_ALTERNATIVE_VIEW,
)();

export const setMenuSelectColumn = createAction(
  ActionTypesEnum.SET_MENU_SELECT_COLUMN,
)<MENU_SELECT_COLUMN>();

export const setMenuSelectIndex = createAction(
  ActionTypesEnum.SET_MENU_SELECT_INDEX,
)<{
  modules?: Nullable<number>;
  challenges?: Nullable<number>;
}>();

export const toggleCodemirrorEditor = createAction(
  ActionTypesEnum.TOGGLE_CODEMIRROR_EDITOR,
)();

export const toggleInstructionsView = createAction(
  ActionTypesEnum.TOGGLE_INSTRUCTIONS_VIEW,
)();

export const setDeepLinkCodeString = createAction(
  ActionTypesEnum.SET_DEEP_LINK_CODE_STRING,
)<{
  codeString: Nullable<string>;
  sandboxChallengeType: Nullable<CHALLENGE_TYPE>;
}>();

export const fetchPullRequestCourseList = createAction(
  ActionTypesEnum.LOAD_PULL_REQUEST_COURSE_LIST,
)<string>();

export const fetchPullRequestCourseListSuccess = createAction(
  ActionTypesEnum.LOAD_PULL_REQUEST_COURSE_LIST_SUCCESS,
)<PullRequestCourseContent>();

export const fetchPullRequestCourseListFailure = createAction(
  ActionTypesEnum.LOAD_PULL_REQUEST_COURSE_LIST_FAILURE,
)<HttpResponseError | undefined>();

export const resetPullRequestState = createAction(
  ActionTypesEnum.RESET_PULL_REQUEST_STATE,
)();

export const setChallengeInstructionsModalState = createAction(
  ActionTypesEnum.SET_CHALLENGE_INSTRUCTIONS_MODAL_STATE,
)<boolean>();
