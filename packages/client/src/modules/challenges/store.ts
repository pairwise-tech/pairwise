import { createReducer } from "typesafe-actions";

// import { CourseList } from "./types";
import { CourseList } from "@prototype/common";
import actions, { ActionTypes } from "./actions";

/** ===========================================================================
 * App Store
 * ============================================================================
 */

export interface State {
  workspaceLoading: boolean;
  displayNavigationMap: boolean;
  courses: Nullable<CourseList>;
  currentModuleId: Nullable<string>;
  currentCourseId: Nullable<string>;
  currentChallengeId: Nullable<string>;
}

const initialState = {
  courses: null,
  workspaceLoading: true,
  currentModuleId: null,
  currentCourseId: null,
  currentChallengeId: null,
  displayNavigationMap: false,
};

const challenges = createReducer<State, ActionTypes>(initialState)
  .handleAction(actions.setWorkspaceChallengeLoaded, (state, action) => ({
    ...state,
    workspaceLoading: false,
  }))
  .handleAction(actions.setNavigationMapState, (state, action) => ({
    ...state,
    displayNavigationMap: action.payload,
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
