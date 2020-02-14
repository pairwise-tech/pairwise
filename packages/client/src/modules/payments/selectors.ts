import identity from "ramda/es/identity";
import { createSelector } from "reselect";

import { ReduxStoreState } from "modules/root";
import { courseSkeletons } from "modules/challenges/selectors";

/** ===========================================================================
 * Selectors
 * ============================================================================
 */

export const paymentsState = (state: ReduxStoreState) => {
  return state.payments;
};

export const purchaseSelector = createSelector([paymentsState], identity);

export const coursePurchaseModalStateSelector = createSelector(
  paymentsState,
  purchase => purchase.paymentCourseModalOpen,
);

export const coursePurchaseId = createSelector(
  paymentsState,
  purchase => purchase.paymentCourseId,
);

// Find the course which corresponds to the current course purchase id,
// if it exists.
export const courseToPurchase = createSelector(
  [coursePurchaseId, courseSkeletons],
  (id, skeletons) => {
    return skeletons?.find(c => c.id === id);
  },
);
