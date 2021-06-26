import { createSelector } from "reselect";
import { ReduxStoreState } from "modules/root";

/** ===========================================================================
 * Selectors
 * ============================================================================
 */

export const paymentsState = (state: ReduxStoreState) => {
  return state.payments;
};

export const paymentRecordsSelector = createSelector(
  [paymentsState],
  (x) => x.paymentRecords,
);
