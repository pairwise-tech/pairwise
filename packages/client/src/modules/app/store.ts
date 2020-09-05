import { createReducer } from "typesafe-actions";
import * as actions from "./actions";
import { AppActionTypes } from "./index";
import * as UserActions from "../user/actions";
import * as ChallengeActions from "../challenges/actions";
import { ChallengesActionTypes } from "../challenges";
import { UserActionTypes } from "../user";

/** ===========================================================================
 * App Store
 * ============================================================================
 */

export interface State {
  initialized: boolean;
  location: string;
  initializationError: boolean;
}

const initialState = {
  initialized: false,
  location: "",
  initializationError: false,
};

const app = createReducer<
  State,
  AppActionTypes | UserActionTypes | ChallengesActionTypes
>(initialState)
  .handleAction(actions.initializeAppSuccess, state => ({
    ...state,
    initialized: true,
  }))
  /**
   * Fetching courses or user should not fail, but if it does there is some
   * real issue (e.g. the server is down).
   */
  .handleAction(
    [UserActions.fetchUserFailure, ChallengeActions.fetchCoursesFailure],
    state => ({
      ...state,
      initializationError: true,
    }),
  )
  .handleAction(actions.locationChange, (state, action) => ({
    ...state,
    location: action.payload.pathname,
  }));

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default app;
