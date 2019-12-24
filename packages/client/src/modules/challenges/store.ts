import { createReducer } from "typesafe-actions";

import actions, { ActionTypes } from "./actions";
import { CourseList, InverseChallengeMapping } from "./types";

/** ===========================================================================
 * App Store
 * ============================================================================
 */

export interface State {
  workspaceLoading: boolean;
  isEditMode: boolean;
  displayNavigationMap: boolean;
  courses: Nullable<CourseList>;
  currentModuleId: Nullable<string>;
  currentCourseId: Nullable<string>;
  currentChallengeId: Nullable<string>;
  challengeMap: Nullable<InverseChallengeMapping>;
}

const initialState = {
  courses: null,
  isEditMode: false,
  workspaceLoading: true,
  currentModuleId: null,
  currentCourseId: null,
  currentChallengeId: null,
  displayNavigationMap: false,
  challengeMap: null,
};

const challenges = createReducer<State, ActionTypes>(initialState)
  .handleAction(actions.setEditMode, (state, action) => ({
    ...state,
    isEditMode: action.payload,
  }))
  .handleAction(actions.setWorkspaceChallengeLoaded, (state, action) => ({
    ...state,
    workspaceLoading: false,
  }))
  .handleAction(actions.setNavigationMapState, (state, action) => ({
    ...state,
    displayNavigationMap: action.payload,
  }))
  .handleAction(actions.storeInverseChallengeMapping, (state, action) => ({
    ...state,
    challengeMap: action.payload,
  }))
  .handleAction(actions.setChallengeId, (state, action) => ({
    ...state,
    displayNavigationMap: false,
    currentChallengeId: action.payload,
  }))
  .handleAction(actions.fetchNavigationSkeletonSuccess, (state, action) => ({
    ...state,
    courses: action.payload,
  }))
  .handleAction(
    actions.fetchCurrentActiveCourseSuccess,
    (state, { payload }) => ({
      ...state,
      ...payload,
    }),
  );

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default challenges;
