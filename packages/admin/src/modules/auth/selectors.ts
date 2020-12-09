import identity from "ramda/es/identity";
import { createSelector } from "reselect";
import { ReduxStoreState } from "modules/root";

/** ===========================================================================
 * Selectors
 * ============================================================================
 */

export const authState = (state: ReduxStoreState) => {
  return state.auth;
};

export const authSelector = createSelector([authState], identity);

export const userAuthenticated = createSelector(
  authSelector,
  authStateResult => {
    return Boolean(authStateResult.accessToken);
  },
);
