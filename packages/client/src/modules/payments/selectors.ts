import identity from "ramda/es/identity";
import { createSelector } from "reselect";

import { ReduxStoreState } from "modules/root";

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
