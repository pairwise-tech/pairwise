import identity from "ramda/es/identity";
import { createSelector } from "reselect";

import { ReduxStoreState } from "modules/root";
import { SANDBOX_ID } from "tools/constants";

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
  app => app.location,
);

export const showFeedbackButton = createSelector(locationSelector, location => {
  return /\/workspace\/\w+/.test(location) && !location.endsWith(SANDBOX_ID);
});
