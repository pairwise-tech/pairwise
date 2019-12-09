import { createReducer } from "typesafe-actions";

import actions, { ActionTypes } from "./actions";
import { ChallengeDictionary, NavigationSkeleton } from "./types";

/** ===========================================================================
 * App Store
 * ============================================================================
 */

export interface State {
  workspaceLoading: boolean;
  currentModuleId: Nullable<string>;
  currentCourseId: Nullable<string>;
  currentChallengeId: Nullable<string>;
  challengeDictionary: ChallengeDictionary;
  navigationSkeleton: Nullable<NavigationSkeleton>;
}

const initialState = {
  workspaceLoading: true,
  currentModuleId: null,
  currentCourseId: null,
  currentChallengeId: null,
  navigationSkeleton: null,
  challengeDictionary: new Map(),
};

const challenges = createReducer<State, ActionTypes>(initialState)
  .handleAction(actions.setWorkspaceChallengeLoaded, (state, action) => ({
    ...state,
    workspaceLoading: false,
  }))
  .handleAction(actions.setChallengeId, (state, action) => ({
    ...state,
    currentChallengeId: action.payload,
  }))
  .handleAction(actions.fetchNavigationSkeletonSuccess, (state, action) => ({
    ...state,
    navigationSkeleton: action.payload,
  }))
  .handleAction(
    actions.fetchCurrentActiveCourseSuccess,
    (state, { payload }) => ({
      ...state,
      currentModuleId: payload.currentModuleId,
      currentCourseId: payload.currentCourseId,
      currentChallengeId: payload.currentChallengeId,
      challengeDictionary: state.challengeDictionary.set(
        payload.course.id,
        payload.course.challenges,
      ),
    }),
  );

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default challenges;
