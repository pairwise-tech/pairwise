import { createReducer } from "typesafe-actions";
import * as actions from "./actions";
import { AppActionTypes } from "./index";

/** ===========================================================================
 * App Store
 * ============================================================================
 */

export interface RealTimeChallengeUpdate {
  id: string;
  challengeId: string;
}

export interface State {
  initialized: boolean;
  location: string;
  initializationError: boolean;
  screensaver: boolean;
  socketIOConnected: boolean;
  realtimeChallengeUpdates: RealTimeChallengeUpdate[];
}

const initialState = {
  initialized: false,
  location: "",
  initializationError: false,
  screensaver: false,
  socketIOConnected: false,
  realtimeChallengeUpdates: [],
};

const app = createReducer<State, AppActionTypes>(initialState)
  .handleAction(actions.initializeAppSuccess, (state) => ({
    ...state,
    initialized: true,
  }))
  .handleAction(actions.appInitializationFailed, (state) => ({
    ...state,
    initializationError: true,
  }))
  .handleAction(actions.addRealTimeChallengeUpdate, (state, action) => ({
    ...state,
    realtimeChallengeUpdates: state.realtimeChallengeUpdates.concat(
      action.payload,
    ),
  }))
  .handleAction(actions.removeRealTimeChallengeUpdate, (state, action) => ({
    ...state,
    realtimeChallengeUpdates: state.realtimeChallengeUpdates.filter(
      (x) => x.id !== action.payload.id,
    ),
  }))
  .handleAction(actions.connectSocketIOSuccess, (state, action) => ({
    ...state,
    socketIOConnected: true,
  }))
  .handleAction(actions.connectSocketIOFailure, (state, action) => ({
    ...state,
    socketIOConnected: false,
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
