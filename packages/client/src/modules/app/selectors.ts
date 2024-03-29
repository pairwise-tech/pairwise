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

export const locationSelector = createSelector(
  appSelector,
  (app) => app.location,
);

export const recentProgressRecordStats = createSelector(
  appSelector,
  (app) => app.recentProgressStats,
);

export const loadingRecentProgressStats = createSelector(
  appSelector,
  (app) => app.loadingRecentProgressStats,
);

export const loadingAnimationComplete = createSelector(
  appSelector,
  (app) => app.loadingAnimationComplete,
);

export const screensaverVisible = createSelector(
  appSelector,
  (app) => app.screensaver,
);

export const isAdminDrawerOpen = createSelector(
  appSelector,
  (app) => app.adminDrawerOpen,
);

export const adminPullRequestId = createSelector(
  appSelector,
  (app) => app.adminPullRequestId,
);
