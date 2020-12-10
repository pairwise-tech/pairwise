import { createReducer } from "typesafe-actions";
import {
  CourseList,
  CourseSkeletonList,
  InverseChallengeMapping,
} from "@pairwise/common";
import * as actions from "./actions";
import App, { AppActionTypes } from "../app/index";
import { ChallengesActionTypes } from "./index";

/** ===========================================================================
 * Challenges Store
 * ============================================================================
 */

export interface State {
  keySelectedMenuItemIndex: Nullable<number>;
  courses: Nullable<CourseList>;
  courseSkeletons: Nullable<CourseSkeletonList>;
  challengeMap: Nullable<InverseChallengeMapping>;
  displayNavigationMap: boolean;
  challengeDetailId: Nullable<string>;
}

const initialState: State = {
  courses: null,
  courseSkeletons: null,
  challengeMap: null,
  displayNavigationMap: false,
  keySelectedMenuItemIndex: null,
  challengeDetailId: null,
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
