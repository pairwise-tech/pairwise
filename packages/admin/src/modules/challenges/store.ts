import { createReducer } from "typesafe-actions";
import {
  ChallengeMeta,
  CourseList,
  CourseSkeletonList,
  PullRequestDiffContext,
  InverseChallengeMapping,
  ICodeBlobDto,
} from "@pairwise/common";
import * as actions from "./actions";
import App, { AppActionTypes } from "../app/index";
import { ChallengesActionTypes } from "./index";

/** ===========================================================================
 * Challenges Store
 * ============================================================================
 */

// cache keys are: uuid-challengeId
export interface BlobCache {
  [key: string]: Nullable<ICodeBlobDto>;
}

export interface ChallengeMetaMap {
  [id: string]: Nullable<ChallengeMeta>;
}

export interface State {
  keySelectedMenuItemIndex: Nullable<number>;
  courses: Nullable<CourseList>;
  courseSkeletons: Nullable<CourseSkeletonList>;
  challengeMap: Nullable<InverseChallengeMapping>;
  displayNavigationMap: boolean;
  challengeDetailId: Nullable<string>;
  pullRequestLoading: boolean;
  pullRequestContext: Nullable<PullRequestDiffContext[]>;
  challengeMetaMap: ChallengeMetaMap;
  blobCache: BlobCache;
}

const initialState: State = {
  courses: null,
  courseSkeletons: null,
  challengeMap: null,
  displayNavigationMap: false,
  keySelectedMenuItemIndex: null,
  challengeDetailId: null,
  pullRequestLoading: false,
  pullRequestContext: null,
  challengeMetaMap: {},
  blobCache: {},
};

/** ===========================================================================
 * Store
 * ============================================================================
 */

const challenges = createReducer<State, ChallengesActionTypes | AppActionTypes>(
  initialState,
)
  .handleAction(actions.setNavigationMapState, (state, action) => ({
    ...state,
    displayNavigationMap: action.payload,
  }))
  .handleAction(actions.setMenuItemSelectIndex, (state, action) => ({
    ...state,
    keySelectedMenuItemIndex: action.payload,
  }))
  .handleAction(actions.setChallengeDetailId, (state, action) => ({
    ...state,
    challengeDetailId: action.payload,
  }))
  .handleAction(App.actions.locationChange, (state, action) => ({
    ...state,
    challengeDetailId: null,
    displayNavigationMap: false,
    keySelectedMenuItemIndex: null,
  }))
  .handleAction(actions.fetchPullRequestContext, (state, action) => ({
    ...state,
    pullRequestLoading: true,
  }))
  .handleAction(actions.fetchPullRequestContextSuccess, (state, action) => ({
    ...state,
    pullRequestLoading: false,
    pullRequestContext: action.payload,
  }))
  .handleAction(actions.fetchPullRequestContextFailure, (state, action) => ({
    ...state,
    pullRequestLoading: false,
    pullRequestContext: null,
  }))
  .handleAction(actions.storeInverseChallengeMapping, (state, action) => ({
    ...state,
    challengeMap: action.payload,
  }))
  .handleAction(actions.fetchNavigationSkeletonSuccess, (state, action) => ({
    ...state,
    courseSkeletons: action.payload,
  }))
  .handleAction(
    [actions.fetchChallengeMetaSuccess, actions.resetChallengeMetaSuccess],
    (state, action) => ({
      ...state,
      challengeMetaMap: {
        ...state.challengeMetaMap,
        [action.payload.challengeId]: action.payload,
      },
    }),
  )
  .handleAction(actions.fetchAllChallengeMetaSuccess, (state, action) => ({
    ...state,
    challengeMetaMap: action.payload.reduce((map, meta) => {
      return {
        ...map,
        [meta.challengeId]: meta,
      };
    }, {}),
  }))
  .handleAction(actions.fetchChallengeBlobSuccess, (state, { payload }) => ({
    ...state,
    blobCache: {
      ...state.blobCache,
      [`${payload.uuid}-${payload.challengeId}`]: payload.blob,
    },
  }))
  .handleAction(actions.fetchCoursesSuccess, (state, { payload }) => ({
    ...state,
    ...payload,
  }));

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default challenges;
