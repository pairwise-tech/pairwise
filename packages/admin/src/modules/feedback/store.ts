import { createReducer } from "typesafe-actions";
import * as actions from "./actions";
import { FeedbackActionTypes } from "./index";
import { IFeedbackDto, UserProfile } from "@pairwise/common";

/** ===========================================================================
 * App Store
 * ============================================================================
 */

export interface FeedbackRecord extends IFeedbackDto {
  uuid: string;
  user: Nullable<UserProfile>;
  createdAt: string;
  updatedAt: string;
}

export interface State {
  feedbackRecords: FeedbackRecord[];
}

const initialState = {
  feedbackRecords: [],
};

const auth = createReducer<State, FeedbackActionTypes>(
  initialState,
).handleAction(actions.fetchAllFeedbackSuccess, (state, action) => ({
  ...state,
  feedbackRecords: action.payload,
}));

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default auth;
