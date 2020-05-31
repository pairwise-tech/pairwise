import { combineEpics } from "redux-observable";
import { filter, map, mergeMap, pluck } from "rxjs/operators";
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
    map(result => {
      if (result.value) {
        const { profile } = result.value;

        // @NOTE Only redirect if they have a last id AND they are on the
        // generic /workspace URL
        if (
          profile &&
          profile.lastActiveChallengeId &&
          deps.router.location.pathname.match(/\/^workspace\/?/) // See NOTE
        ) {
          deps.router.push(`/workspace/${profile.lastActiveChallengeId}`);
        }

        return Actions.fetchUserSuccess(result.value);
      } else {
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
    map(result => {
      if (result.value) {
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
    mergeMap(async email => {
      const valid = validate(email);
      if (!valid) {
        deps.toaster.error("Please enter a valid email...");
        return Actions.updateUserEmailFailure();
      }

      deps.toaster.warn("Sending email verification link...");
      const result = await API.updateUserEmail(email);
      if (result.value) {
        deps.toaster.success(
          "Please check your email for verification instructions.",
        );
        return Actions.updateUserEmailSuccess();
      } else {
        // Display the error message
        if (result.error.status === 400) {
          deps.toaster.error(
            result.error.message || "Failed to update email address...",
          );
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
    map(result => {
      if (result.value) {
        return Actions.updateUserSettingsSuccess(result.value);
      } else {
        return Actions.updateUserSettingsFailure(result.error);
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
);
