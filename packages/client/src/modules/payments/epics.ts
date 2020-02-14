import { combineEpics } from "redux-observable";
import {
  filter,
  tap,
  mergeMap,
  pluck,
  map,
  ignoreElements,
} from "rxjs/operators";
import { isActionOf } from "typesafe-actions";
import { of, combineLatest } from "rxjs";
import {
  removeEphemeralPurchaseCourseId,
  getEphemeralPurchaseCourseId,
  setEphemeralPurchaseCourseId,
} from "tools/storage-utils";
import { EpicSignature } from "../root";
import { Actions } from "../root-actions";
import { CourseSkeletonList } from "@pairwise/common";
import { STRIPE_API_KEY } from "tools/client-env";
import { wait } from "tools/utils";

/** ===========================================================================
 * Epics
 * ============================================================================
 */

/**
 * After the app is initialized and the course skeletons have been fetched,
 * handle the edge case logic where a user just signed in after expressing
 * the intent to purchase a course. In this case, there is an ephemeral
 * course id stored in local storage which should be used to prompt them
 * with the purchase course modal.
 *
 * In either case, remove this ephemeral token.
 */
const purchaseCourseInitializeEpic: EpicSignature = action$ => {
  return combineLatest(
    action$.pipe(filter(isActionOf(Actions.fetchNavigationSkeletonSuccess))),
    action$.pipe(filter(isActionOf(Actions.storeAccessTokenSuccess))),
  ).pipe(
    /* Wtf: types!? */
    mergeMap(([skeletonAction, initAction]: any) => {
      if (initAction.payload.accessToken) {
        const skeletons: CourseSkeletonList = skeletonAction.payload;

        /* Validate that the course id exists */
        const id = getEphemeralPurchaseCourseId();

        const course = skeletons.find(c => c.id === id);
        if (id && course) {
          return of(
            Actions.setPurchaseCourseId({ courseId: id }),
            Actions.setPurchaseCourseModalState(true),
          );
        }
      }

      return of(Actions.empty("No purchase course id actions to take"));
    }),
    tap(removeEphemeralPurchaseCourseId),
  );
};

/**
 * A user expresses the intent to purchase a course:
 *
 * [1] The user is signed in and they should see the purchase modal.
 * [2] The user is not signed in and must sign in or create and account, in
 *     this case prompt them to sign in and store an ephemeral course id
 *     in local storage which can be used to continue the purchase flow
 *     once they return to the app as an authenticated user.
 */
const handlePurchaseCourseIntentEpic: EpicSignature = (
  action$,
  state$,
  deps,
) => {
  return action$.pipe(
    filter(isActionOf(Actions.handlePurchaseCourseIntent)),
    pluck("payload"),
    pluck("courseId"),
    mergeMap(courseId => {
      const user = deps.selectors.user.userProfile(state$.value);
      if (user) {
        return of(
          Actions.setPurchaseCourseId({ courseId }),
          Actions.setPurchaseCourseModalState(true),
        );
      } else {
        deps.toaster.warn(
          "Please create an account to purchase this course",
          "user",
        );
        setEphemeralPurchaseCourseId(courseId);
        return of(
          Actions.setPurchaseCourseId({ courseId }),
          Actions.setSingleSignOnDialogState(true),
        );
      }
    }),
  );
};

const startCheckoutEpic: EpicSignature = (action$, state$, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.startCheckout)),
    pluck("payload"),
    pluck("courseId"),
    mergeMap(deps.api.createCheckoutSession),
    map(result => {
      if (result.value) {
        return Actions.startCheckoutSuccess(result.value);
      } else {
        return Actions.startCheckoutFailure(result.error);
      }
    }),
  );
};

type StripeLibrary = any; /* What's the type definition? */

// Initialize stripe module. The module is imported by an
// asynchronously loaded .js file in a script tag from the application
// index.html file. Apparently the library may not always loaded quickly
// enough (???), therefore the calling function handles retry logic.
const getStripeJsLibrary = (): Nullable<StripeLibrary> => {
  // @ts-ignore where is the type definition...
  const lib = Stripe;
  if (lib !== undefined) {
    const stripe: StripeLibrary = lib(STRIPE_API_KEY);
    return stripe;
  }

  return null;
};

// Handle redirect to Stripe portal, the stripe.js library may not have
// loaded yet which will crash the entire Workspace... Ok, let's just retry
// a few times in case the library is not loaded yet. Blegh:
const handleRedirectToStripeCheckoutFlow = async (
  sessionId: string,
  retries: number = 3,
): Promise<any> => {
  const library = getStripeJsLibrary();
  if (library === null) {
    if (retries > 0) {
      await wait(500); /* Pause and retry... */
      return handleRedirectToStripeCheckoutFlow(sessionId, retries - 1);
    } else {
      throw new Error("Could not find Stripe library!");
    }
  }

  const result = await library.redirectToCheckout({
    sessionId,
  });

  // If `redirectToCheckout` fails due to a browser or network
  // error, display the localized error message to your customer
  // using `error.message`.
  throw new Error(`Failure to handle redirect! Error: ${result.error.message}`);
};

// Redirect the user to the Stripe checkout portal after successfully
// creating a checkout session id.
const redirectToStripeCheckoutEpic: EpicSignature = (action$, state$, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.startCheckoutSuccess)),
    pluck("payload"),
    pluck("stripeCheckoutSessionId"),
    mergeMap(async id => {
      try {
        await handleRedirectToStripeCheckoutFlow(id);
      } catch (err) {
        console.warn("[WARN]: Error starting Stripe checkout flow: ", err);
        deps.toaster.error("Checkout failed, please try again...");
      }
    }),
    ignoreElements(),
  );
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default combineEpics(
  startCheckoutEpic,
  purchaseCourseInitializeEpic,
  handlePurchaseCourseIntentEpic,
  redirectToStripeCheckoutEpic,
);
