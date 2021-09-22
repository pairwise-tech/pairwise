import {
  ChallengeMeta,
  Course,
  CourseSkeletonList,
  ICodeBlobDto,
  InverseChallengeMapping,
  PullRequestDiffContext,
} from "@pairwise/common";
import { createAction } from "typesafe-actions";
import { HttpResponseError } from "modules/api";

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

  FETCH_CHALLENGE_META = "FETCH_CHALLENGE_META",
  FETCH_CHALLENGE_META_SUCCESS = "FETCH_CHALLENGE_META_SUCCESS",
  FETCH_CHALLENGE_META_FAILURE = "FETCH_CHALLENGE_META_FAILURE",

  FETCH_ALL_CHALLENGE_META = "FETCH_ALL_CHALLENGE_META",
  FETCH_ALL_CHALLENGE_META_SUCCESS = "FETCH_ALL_CHALLENGE_META_SUCCESS",
  FETCH_ALL_CHALLENGE_META_FAILURE = "FETCH_ALL_CHALLENGE_META_FAILURE",

  RESET_CHALLENGE_META = "RESET_CHALLENGE_META",
  RESET_CHALLENGE_META_SUCCESS = "RESET_CHALLENGE_META_SUCCESS",
  RESET_CHALLENGE_META_FAILURE = "RESET_CHALLENGE_META_FAILURE",

  FETCH_CHALLENGE_BLOB = "FETCH_CHALLENGE_BLOB",
  FETCH_CHALLENGE_BLOB_SUCCESS = "FETCH_CHALLENGE_BLOB_SUCCESS",
  FETCH_CHALLENGE_BLOB_FAILURE = "FETCH_CHALLENGE_BLOB_FAILURE",
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
)<PullRequestDiffContext[]>();

export const fetchPullRequestContextFailure = createAction(
  ActionTypesEnum.FETCH_PULL_REQUEST_CONTEXT_FAILURE,
)<HttpResponseError>();

export const fetchChallengeMeta = createAction(
  ActionTypesEnum.FETCH_CHALLENGE_META,
)<string>();

export const fetchChallengeMetaSuccess = createAction(
  ActionTypesEnum.FETCH_CHALLENGE_META_SUCCESS,
)<ChallengeMeta>();

export const fetchChallengeMetaFailure = createAction(
  ActionTypesEnum.FETCH_CHALLENGE_META_FAILURE,
)<HttpResponseError>();

export const fetchAllChallengeMeta = createAction(
  ActionTypesEnum.FETCH_ALL_CHALLENGE_META,
)<string>();

export const fetchAllChallengeMetaSuccess = createAction(
  ActionTypesEnum.FETCH_ALL_CHALLENGE_META_SUCCESS,
)<ChallengeMeta[]>();

export const fetchAllChallengeMetaFailure = createAction(
  ActionTypesEnum.FETCH_ALL_CHALLENGE_META_FAILURE,
)<HttpResponseError>();

export const resetChallengeMeta = createAction(
  ActionTypesEnum.RESET_CHALLENGE_META,
)<string>();

export const resetChallengeMetaSuccess = createAction(
  ActionTypesEnum.RESET_CHALLENGE_META_SUCCESS,
)<ChallengeMeta>();

export const resetChallengeMetaFailure = createAction(
  ActionTypesEnum.RESET_CHALLENGE_META_FAILURE,
)<HttpResponseError>();

export const fetchChallengeBlob = createAction(
  ActionTypesEnum.FETCH_CHALLENGE_BLOB,
)<{ uuid: string; challengeId: string }>();

export const fetchChallengeBlobSuccess = createAction(
  ActionTypesEnum.FETCH_CHALLENGE_BLOB_SUCCESS,
)<{ blob: ICodeBlobDto; uuid: string; challengeId: string }>();

export const fetchChallengeBlobFailure = createAction(
  ActionTypesEnum.FETCH_CHALLENGE_BLOB_FAILURE,
)<HttpResponseError>();
