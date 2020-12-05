import { createReducer } from "typesafe-actions";
import { CourseList, CourseSkeletonList, DataBlob } from "@pairwise/common";
import * as actions from "./actions";
import App, { AppActionTypes } from "../app/index";
import { InverseChallengeMapping } from "./types";
import { ChallengesActionTypes } from "./index";

/** ===========================================================================
 * Challenges Store
 * ============================================================================
 */

/**
 * The challenge blobs represent the user's past history on a challenge,
 * and they get fetched one by one by id. The blobCache stores the blob
 * data and loading status for each blob. The workspace waits for blobs
 * to load before rendering.
 */
interface BlobCacheItem {
  dataBlob?: DataBlob;
  isLoading: boolean;
}

export interface State {
  workspaceLoading: boolean;
  courses: Nullable<CourseList>;
  courseSkeletons: Nullable<CourseSkeletonList>;
  currentModuleId: Nullable<string>;
  currentCourseId: Nullable<string>;
  currentChallengeId: Nullable<string>;
  challengeMap: Nullable<InverseChallengeMapping>;
  isDirty: boolean;
}

const initialState: State = {
  courses: null,
  courseSkeletons: null,
  workspaceLoading: true,
  currentModuleId: null,
  currentCourseId: null,
  currentChallengeId: null,
  challengeMap: null,
  isDirty: false,
};

/** ===========================================================================
 * Store
 * ============================================================================
 */

const challenges = createReducer<State, ChallengesActionTypes | AppActionTypes>(
  initialState,
)
  .handleAction(actions.setChallengeIdContext, (state, { payload }) => ({
    ...state,
    adminTestTab: "testResults",
    adminEditorTab: "starterCode",
    displayNavigationMap: false,
    revealWorkspaceSolution: false,
    currentModuleId: payload.currentModuleId,
    currentCourseId: payload.currentCourseId,
    currentChallengeId: payload.currentChallengeId,
  }))
  .handleAction(actions.setWorkspaceChallengeLoaded, (state, action) => ({
    ...state,
    workspaceLoading: false,
  }))
  .handleAction(App.actions.locationChange, (state, action) => ({
    ...state,
    displayNavigationMap: false,
  }))
  .handleAction(actions.storeInverseChallengeMapping, (state, action) => ({
    ...state,
    challengeMap: action.payload,
  }))
  .handleAction(actions.fetchNavigationSkeletonSuccess, (state, action) => ({
    ...state,
    courseSkeletons: action.payload,
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
