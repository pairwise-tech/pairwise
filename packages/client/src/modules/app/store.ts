import { createReducer } from "typesafe-actions";
import { RecentProgressPublicStats } from "../../../../common/dist/main";
import * as actions from "./actions";
import { AppActionTypes } from "./index";

/** ===========================================================================
 * App Store
 * ============================================================================
 */

export interface State {
  initialized: boolean;
  location: string;
  initializationError: boolean;
  screensaver: boolean;
  loadingAnimationComplete: boolean;
  adminDrawerOpen: boolean;
  adminPullRequestId: string;
  loadingRecentProgressStats: boolean;
  recentProgressStats: Nullable<RecentProgressPublicStats>;
}

const initialState: State = {
  initialized: false,
  location: "",
  initializationError: false,
  screensaver: false,
  loadingAnimationComplete: false,
  adminDrawerOpen: false,
  adminPullRequestId: "",
  loadingRecentProgressStats: false,
  recentProgressStats: null,
};

const app = createReducer<State, AppActionTypes>(initialState)
  .handleAction(actions.setScreensaverState, (state, action) => ({
    ...state,
    screensaver: action.payload,
  }))
  .handleAction(actions.initializeAppSuccess, (state) => ({
    ...state,
    initialized: true,
  }))
  .handleAction(actions.appInitializationFailed, (state) => ({
    ...state,
    initializationError: true,
  }))
  .handleAction(actions.setLoadingAnimationComplete, (state) => ({
    ...state,
    loadingAnimationComplete: true,
  }))
  .handleAction(actions.setAdminDrawerState, (state, action) => ({
    ...state,
    adminDrawerOpen: action.payload.isOpen,
  }))
  .handleAction(actions.setAdminPullRequestId, (state, action) => ({
    ...state,
    adminPullRequestId: action.payload,
  }))
  .handleAction(actions.fetchRecentProgressRecords, (state, action) => ({
    ...state,
    recentProgressStats: null,
    loadingRecentProgressStats: true,
  }))
  .handleAction(actions.fetchRecentProgressRecordsFailure, (state, action) => ({
    ...state,
    recentProgressStats: null,
    loadingRecentProgressStats: false,
  }))
  .handleAction(actions.fetchRecentProgressRecordsSuccess, (state, action) => ({
    ...state,
    loadingRecentProgressStats: false,
    recentProgressStats: action.payload,
  }))
  .handleAction(actions.locationChange, (state, action) => ({
    ...state,
    location: action.payload.pathname,
  }));

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default app;
