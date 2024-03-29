import identity from "ramda/es/identity";
import { createSelector } from "reselect";

import { ReduxStoreState } from "modules/root";

/** ===========================================================================
 * Selectors
 * ============================================================================
 */

export const appState = (state: ReduxStoreState) => {
  return state.app;
};

export const appSelector = createSelector([appState], identity);

export const realtimeChallengeUpdates = createSelector(
  [appState],
  (appState) => appState.realtimeChallengeUpdates,
);

export const socketIOConnected = createSelector(
  [appState],
  (appState) => appState.socketIOConnected,
);

export const connectedClientsSelector = createSelector(
  [appState],
  (appState) => appState.connectedClientsCount,
);

export const locationSelector = createSelector(
  appSelector,
  (app) => app.location,
);
