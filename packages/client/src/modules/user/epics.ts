import { combineEpics } from "redux-observable";
import { filter, map, mergeMap, pluck } from "rxjs/operators";
import { isActionOf } from "typesafe-actions";
import API from "modules/api";
import { EpicSignature } from "../root";
import { Actions } from "../root-actions";

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

const updateUserEmailEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.updateUserEmail)),
    pluck("payload"),
    mergeMap(API.updateUserEmail),
    map(result => {
      if (result.value) {
        deps.toaster.warn("Please check your email for a verification link.");
        return Actions.updateUserEmailSuccess();
      } else {
        if (result.error.status !== 401) {
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
