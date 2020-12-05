import { createReducer } from "typesafe-actions";
import {
  Module,
  Challenge,
  CourseList,
  CourseSkeletonList,
  DataBlob,
} from "@pairwise/common";
import * as actions from "./actions";
import App, { AppActionTypes } from "../app/index";
import { InverseChallengeMapping, SearchResult } from "./types";
import { defaultSandboxChallenge } from "tools/utils";
import { ChallengesActionTypes } from "./index";

/** ===========================================================================
 * Challenges Store
 * ============================================================================
 */

export type ADMIN_TEST_TAB = "testResults" | "testCode";
export type ADMIN_EDITOR_TAB = "starterCode" | "solutionCode";

interface AccordionViewState {
  [key: string]: boolean;
}

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
  isEditMode: boolean;
  editModeAlternativeView: boolean;
  displayNavigationMap: boolean;
  courses: Nullable<CourseList>;
  courseSkeletons: Nullable<CourseSkeletonList>;
  currentModuleId: Nullable<string>;
  currentCourseId: Nullable<string>;
  currentChallengeId: Nullable<string>;
  challengeMap: Nullable<InverseChallengeMapping>;
  sandboxChallenge: Challenge;
  blobCache: { [key: string]: BlobCacheItem };
  adminTestTab: ADMIN_TEST_TAB;
  adminEditorTab: ADMIN_EDITOR_TAB;
  navigationSectionAccordionViewState: AccordionViewState;
  searchResults: SearchResult[];
  isSearching: boolean;
  revealWorkspaceSolution: boolean;
  isDirty: boolean;
}

const initialState: State = {
  courses: null,
  courseSkeletons: null,
  isEditMode: false,
  editModeAlternativeView: false,
  workspaceLoading: true,
  currentModuleId: null,
  currentCourseId: null,
  currentChallengeId: null,
  displayNavigationMap: false,
  challengeMap: null,
  sandboxChallenge: defaultSandboxChallenge,
  blobCache: {},
  adminTestTab: "testResults",
  adminEditorTab: "starterCode",
  navigationSectionAccordionViewState: {},
  searchResults: [],
  isSearching: false,
  revealWorkspaceSolution: false,
  isDirty: false,
};

/** ===========================================================================
 * Store Utils
 * ============================================================================
 */

interface ChallengeUpdate {
  id: string; // Challenge ID
  moduleId: string;
  courseId: string;
  challenge: Partial<Challenge>;
}

interface ModuleUpdate {
  id: string;
  courseId: string;
  module: Partial<Module>;
}

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
  .handleAction(actions.updateCurrentChallengeBlob, (state, action) => ({
    ...state,
    blobCache: {
      ...state.blobCache,
      [action.payload.challengeId]: {
        isLoading: false,
        dataBlob: action.payload.dataBlob,
      },
    },
  }))
  .handleAction(actions.fetchBlobForChallenge, (state, action) => ({
    ...state,
    blobCache: {
      ...state.blobCache,
      [action.payload]: {
        isLoading: true,
        dataBlob: state.blobCache[action.payload]?.dataBlob,
      },
    },
  }))
  .handleAction(actions.fetchBlobForChallengeSuccess, (state, action) => ({
    ...state,
    blobCache: {
      ...state.blobCache,
      [action.payload.challengeId]: {
        isLoading: false,
        dataBlob: action.payload.dataBlob,
      },
    },
  }))
  .handleAction(actions.fetchBlobForChallengeFailure, (state, action) => ({
    ...state,
    blobCache: {
      ...state.blobCache,
      [action.payload.challengeId]: {
        isLoading: false,
        dataBlob: state.blobCache[action.payload.challengeId]?.dataBlob,
      },
    },
  }))
  .handleAction(actions.setWorkspaceChallengeLoaded, (state, action) => ({
    ...state,
    workspaceLoading: false,
  }))
  .handleAction(App.actions.locationChange, (state, action) => ({
    ...state,
    displayNavigationMap: false,
  }))
  .handleAction(actions.setNavigationMapState, (state, action) => ({
    ...state,
    displayNavigationMap: action.payload,
  }))
  .handleAction(actions.storeInverseChallengeMapping, (state, action) => ({
    ...state,
    challengeMap: action.payload,
  }))
  .handleAction(actions.setCurrentModule, (state, action) => ({
    ...state,
    currentModuleId: action.payload,
  }))
  .handleAction(actions.setCurrentCourse, (state, action) => ({
    ...state,
    currentCourseId: action.payload,
    // Update the current module id to the first module in the course
    currentModuleId: state.courses?.find(c => c.id === action.payload)
      ?.modules[0].id as string,
  }))
  .handleAction(actions.requestSearchResults, (state, action) => ({
    ...state,
    isSearching: true,
  }))
  .handleAction(actions.receiveSearchResults, (state, action) => ({
    ...state,
    searchResults: action.payload,
    isSearching: false,
  }))
  .handleAction(actions.fetchNavigationSkeletonSuccess, (state, action) => ({
    ...state,
    courseSkeletons: action.payload,
  }))
  .handleAction(actions.toggleSectionAccordionView, (state, action) => ({
    ...state,
    navigationSectionAccordionViewState: {
      ...state.navigationSectionAccordionViewState,
      [action.payload.sectionId]: action.payload.open,
    },
  }))
  .handleAction(actions.toggleRevealSolutionCode, (state, action) => ({
    ...state,
    revealWorkspaceSolution: action.payload.shouldReveal,
  }))
  .handleAction(actions.setAdminTestTab, (state, action) => ({
    ...state,
    adminTestTab: action.payload,
  }))
  .handleAction(actions.setAdminEditorTab, (state, action) => ({
    ...state,
    adminEditorTab: action.payload,
  }))
  .handleAction(actions.toggleEditModeAlternativeView, (state, action) => ({
    ...state,
    editModeAlternativeView: !state.editModeAlternativeView,
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
