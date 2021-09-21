import * as EmailValidator from "email-validator";
import { combineEpics } from "redux-observable";
import {
  filter,
  ignoreElements,
  tap,
  delay,
  mergeMap,
  pluck,
  map,
  mapTo,
  mergeMapTo,
  switchMap,
} from "rxjs/operators";
import { isActionOf } from "typesafe-actions";
import { of } from "rxjs";
import {
  setAccessTokenInLocalStorage,
  logoutUserInLocalStorage,
  getAccessTokenFromLocalStorage,
} from "tools/storage-utils";
import { EpicSignature } from "../root";
import { Actions } from "../root-actions";
import { APP_INITIALIZATION_TYPE } from "tools/utils";

/** ===========================================================================
 * Epics
 * ============================================================================
 */

/**
 * Handle access token initialization. This epic receives an action which is
 * produced when the application first loads (see ApplicationContainer) which
 * contains the initial page URL. This is important because login attempts
 * redirect to the app and pass the accessToken as a parameter, which is
 * then extracted here. If this token does not exist, the token may be in
 * local storage and that is used instead. The result is eventually sent to
 * the next epic which handles the next steps in the access token
 * initialization flow.
 */
const accessTokenInitializationEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.captureAppInitializationUrl)),
    pluck("payload"),
    map((payload) => {
      const { params, appInitializationType } = payload;
      const { accessToken } = params;

      let accountCreated = false;
      let token = getAccessTokenFromLocalStorage();

      if (appInitializationType === APP_INITIALIZATION_TYPE.ACCOUNT_CREATED) {
        accountCreated = true;
        token = accessToken as string;
        deps.toaster.success("Welcome to Pairwise! 🎉");
      } else if (appInitializationType === APP_INITIALIZATION_TYPE.SIGN_IN) {
        accountCreated = false;
        token = accessToken as string;
      }

      return Actions.storeAccessToken({
        accountCreated,
        accessToken: token,
      });
    }),
  );
};

/**
 * This epic is responsible for storing the access token during the app
 * initialization process. It produces the app initialization success action
 * in addition to an access token success action if an access token is
 * determined to exist.
 */
const storeAccessTokenEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.storeAccessToken)),
    tap(({ payload }) => {
      const { accessToken } = payload;

      /**
       * Redirect the user if the are on a protected route... This could
       * be done with React Router but I like using epics.
       *
       * /account is probably the only protected route like this, but more
       * could be added in the future if needed.
       */
      if (!accessToken) {
        if (deps.router.location.pathname.includes("account")) {
          deps.router.push(`/home`);
        }
      }

      setAccessTokenInLocalStorage(accessToken);
    }),
    mergeMap(({ payload }) => {
      const { accessToken } = payload;
      return of(
        Actions.storeAccessTokenSuccess(payload),
        Actions.initializeAppSuccess({ accessToken }),
      );
    }),
  );
};

/**
 * Check if the logged in user is an admin.
 */
const isUserAdminEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.storeAccessTokenSuccess)),
    filter((x) => x.payload.accessToken !== ""),
    mergeMap(deps.api.isUserAdmin),
    map((result) => {
      if (result.value) {
        return Actions.userIsAdmin();
      } else {
        return Actions.empty("isUserAdminEpic no-op - user is not an admin.");
      }
    }),
  );
};

/**
 * This epic should only run one time per user: the first time the user creates
 * an account which will result in the access token initialization flow with
 * the { accountCreated: true } field.
 *
 * In this case, we want to start a process to persist any of their local
 * saved progress to their new account on the server.
 */
const accountCreationEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.storeAccessTokenSuccess)),
    pluck("payload"),
    pluck("accountCreated"),
    filter(Boolean),
    mapTo(Actions.initiateBulkPersistence()),
  );
};

/* Nice! */
const bulkPersistenceEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.initiateBulkPersistence)),
    mergeMap(deps.api.handleDataPersistenceForNewAccount),
    mergeMapTo(of(Actions.fetchUser(), Actions.bulkPersistenceComplete())),
  );
};

// Dispatch a request for a magic email login link
const loginByEmailEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.loginByEmail)),
    pluck("payload"),
    pluck("email"),
    switchMap(async (email) => {
      // Validate email address
      const valid = EmailValidator.validate(email);
      if (!valid) {
        deps.toaster.warn("Please enter a valid email.");
        return Actions.loginByEmailFailure();
      }

      // Send the request
      const result = await deps.api.loginByEmail(email);
      if (result.value) {
        deps.toaster.success(
          "Email sent! If you don't see it, you may need to check your spam or junk folder.",
        );
        return Actions.loginByEmailSuccess();
      } else {
        deps.toaster.warn("Could not send email...");
        return Actions.loginByEmailFailure();
      }
    }),
  );
};

/**
 * Handle logging out the user.
 */
const logoutUserEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.logoutUser)),
    pluck("payload"),
    mergeMap(async (payload) => {
      const result = await deps.api.logoutUser();

      if (result.error) {
        console.error("Error occurring processing logout.", result.error);
      }

      return Actions.logoutUserSuccess(payload);
    }),
  );
};

// Logout the user by removing the local storage access token.
const logoutUserSuccessEpic: EpicSignature = (action$, _, deps) => {
  const logoutToast = () => {
    deps.toaster.success("Logout Success", { icon: "log-out" });
  };

  return action$.pipe(
    filter(isActionOf(Actions.logoutUserSuccess)),
    tap(logoutUserInLocalStorage),
    // Put a short delay so the user feels like something actually happened.
    delay(250),
    tap(logoutToast),
    tap(({ payload }) => {
      // Optionally reload the page.
      if (payload.shouldReloadPage === true) {
        window.location.reload();
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
  accessTokenInitializationEpic,
  storeAccessTokenEpic,
  accountCreationEpic,
  bulkPersistenceEpic,
  loginByEmailEpic,
  isUserAdminEpic,
  logoutUserEpic,
  logoutUserSuccessEpic,
);
