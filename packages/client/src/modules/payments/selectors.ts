import identity from "ramda/es/identity";
import { createSelector } from "reselect";

import { ReduxStoreState } from "modules/root";
import { courseSkeletons } from "modules/challenges/selectors";

/** ===========================================================================
 * Selectors
 * ============================================================================
 */

export const purchaseState = (state: ReduxStoreState) => {
  return state.purchase;
};

export const purchaseSelector = createSelector([purchaseState], identity);

export const coursePurchaseModalStateSelector = createSelector(
  purchaseState,
  purchase => purchase.purchaseCourseModalOpen,
);

export const coursePurchaseId = createSelector(
  purchaseState,
  purchase => purchase.purchaseCourseId,
);

export const courseToPurchase = createSelector(
  [coursePurchaseId, courseSkeletons],
  (id, skeletons) => {
    return skeletons?.find(c => c.id === id);
  },
);
