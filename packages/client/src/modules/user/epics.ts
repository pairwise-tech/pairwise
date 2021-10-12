import { combineEpics } from "redux-observable";
import {
  delay,
  filter,
  map,
  mapTo,
  mergeMap,
  pluck,
  tap,
} from "rxjs/operators";
import { isActionOf } from "typesafe-actions";
import API from "modules/api";
import { EpicSignature } from "../root";
import { Actions } from "../root-actions";
import { validate } from "email-validator";

/** ===========================================================================
 * Epics
 * ============================================================================
 */

const fetchUserEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf([Actions.storeAccessTokenSuccess, Actions.fetchUser])),
    mergeMap(API.fetchUserProfile),
    map((result) => {
      if (result.ok) {
        return Actions.fetchUserSuccess(result.value);
      } else {
        deps.toaster.warn(
          "An issue occurred with the Pairwise servers and we could not retrieve your user profile right now.\n\n You are not logged in currently.",
        );
        return Actions.fetchUserFailure(result.error);
      }
    }),
  );
};

const updateUserEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.updateUser)),
    pluck("payload"),
    mergeMap(API.updateUser),
    map((result) => {
      if (result.ok) {
        deps.toaster.success("Profile Updated 👍");
        return Actions.updateUserSuccess(result.value);
      } else {
        if (result.error.status !== 401) {
          deps.toaster.warn(
            result.error.message || "Failure to update user profile...",
          );
        }
        return Actions.updateUserFailure(result.error);
      }
    }),
  );
};

/**
 * Handle updating a user email. The user must verify the email address
 * for the change to occur. The email update is handled by a different API
 * from the API which handles user profile updates (see above epic).
 */
const updateUserEmailEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.updateUserEmail)),
    pluck("payload"),
    mergeMap(async (email) => {
      const valid = validate(email);
      if (!valid) {
        deps.toaster.error("Please enter a valid email...");
        return Actions.updateUserEmailFailure();
      }

      deps.toaster.warn("Sending email verification link...");
      const result = await API.updateUserEmail(email);
      if (result.ok) {
        deps.toaster.success(
          "Please check your email for verification instructions.",
        );
        return Actions.updateUserEmailSuccess();
      } else {
        // Display the error message
        const { status } = result.error;
        if (status === 400) {
          deps.toaster.error(
            result.error.message || "Failed to update email address...",
          );
        } else if (status !== 401) {
          deps.toaster.error("Failed to update email address...");
        }
        return Actions.updateUserEmailFailure();
      }
    }),
  );
};

const updateUserSettingsEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.updateUserSettings)),
    pluck("payload"),
    mergeMap(API.updateUserSettings),
    map((result) => {
      if (result.ok) {
        return Actions.updateUserSettingsSuccess(result.value);
      } else {
        return Actions.updateUserSettingsFailure(result.error);
      }
    }),
  );
};

const fetchUserLeaderboardEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.fetchUserLeaderboard)),
    mergeMap(API.fetchUserLeaderboard),
    map((result) => {
      if (result.ok) {
        return Actions.fetchUserLeaderboardSuccess(result.value);
      } else {
        return Actions.fetchUserLeaderboardFailure(result.error);
      }
    }),
  );
};

const disconnectAccountEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.disconnectAccount)),
    pluck("payload"),
    mergeMap(API.disconnectAccount),
    map((result) => {
      if (result.ok) {
        deps.toaster.success("Account disconnected.");
        return Actions.disconnectAccountSuccess(result.value);
      } else {
        return Actions.disconnectAccountFailure(result.error);
      }
    }),
  );
};

const deleteUserAccountEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.deleteUserAccount)),
    tap(() => deps.toaster.warn("Deleting user account...")),
    mergeMap(API.deleteUserAccount),
    map((result) => {
      if (result.ok) {
        deps.toaster.warn(
          "Your account has been permanently deleted. You will be logged out now.",
        );
        return Actions.deleteUserAccountSuccess();
      } else {
        deps.toaster.warn(
          "An issued occurred. Please try again or email contact@pairwise.tech for help.",
        );
        return Actions.deleteUserAccountFailure(result.error);
      }
    }),
  );
};

const deleteUserAccountLogoutEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.deleteUserAccountSuccess)),
    delay(2500),
    mapTo(Actions.logoutUser({ shouldReloadPage: true })),
  );
};

const fetchPublicUserProfileEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.fetchPublicUserProfile)),
    pluck("payload"),
    pluck("username"),
    mergeMap(API.fetchUserPublicProfileByUsername),
    map((result) => {
      if (result.ok) {
        return Actions.fetchPublicUserProfileSuccess(result.value);
      } else {
        return Actions.fetchPublicUserProfileFailure(result.error);
      }
    }),
  );
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default combineEpics(
  fetchUserEpic,
  updateUserEpic,
  updateUserEmailEpic,
  updateUserSettingsEpic,
  fetchUserLeaderboardEpic,
  disconnectAccountEpic,
  deleteUserAccountEpic,
  deleteUserAccountLogoutEpic,
  fetchPublicUserProfileEpic,
);
