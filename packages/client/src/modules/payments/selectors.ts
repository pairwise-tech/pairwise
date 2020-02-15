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
  payments => payments.paymentCourseModalOpen,
);

export const paymentIntentCourseId = createSelector(
  paymentsState,
  payments => payments.paymentIntentCourseId,
);

export const paymentSuccessCourseId = createSelector(
  paymentsState,
  payments => payments.paymentSuccessCourseId,
);

// Find the course which corresponds to the current course purchase id,
// if it exists.
export const paymentIntentCourse = createSelector(
  [paymentIntentCourseId, courseSkeletons],
  (id, skeletons) => {
    return skeletons?.find(c => c.id === id);
  },
);

// Find the course which corresponds to the current course purchase id,
// if it exists.
export const paymentSuccessCourse = createSelector(
  [paymentSuccessCourseId, courseSkeletons],
  (id, skeletons) => {
    return skeletons?.find(c => c.id === id);
  },
);
