import { combineEpics } from "redux-observable";
import { filter, map, mergeMap, pluck } from "rxjs/operators";
import { isActionOf } from "typesafe-actions";

import API, { HttpResponseError } from "modules/api";
import { EpicSignature } from "../root";
import { Actions } from "../root-actions";
import { UserSettings, Err, Ok, IUserDto, UserProfile } from "@pairwise/common";

/** ===========================================================================
 * Epics
 * ============================================================================
 */

const fetchUserEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.storeAccessTokenSuccess)),
    mergeMap(API.fetchUserProfile),
    map(result => {
      if (result.value) {
        const { profile } = result.value;
        if (profile && profile.lastActiveChallengeId) {
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
        deps.toaster.show({
          icon: "tick",
          intent: "success",
          message: "Saved 👍",
        });
        return Actions.updateUserSuccess(result.value);
      } else {
        if (result.error.status !== 401) {
          deps.toaster.show({
            icon: "error",
            intent: "danger",
            message: "Failure to update user profile...",
          });
        }
        return Actions.updateUserFailure(result.error);
      }
    }),
  );
};

const updateUserSettingsEpic: EpicSignature = (action$, state$, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.updateUserSettings)),
    pluck("payload"),
    map(payload => ({ ...state$.value.user.settings, ...payload })),
    mergeMap(API.updateUserSettings),
    map(result => {
      if (isUserSettings(result)) {
        return Actions.updateUserSettingsSuccess(result);
      } else if (result.value) {
        return Actions.updateUserSettingsSuccess(result.value.settings);
      } else {
        return Actions.updateUserSettingsFailure(result.error);
      }
    }),
  );
};

// type guard for safely accessing response from updateUserSettings
// API call which may return an already unwrapped user settings
// object from local storage if the user is not authenticated
const isUserSettings = (
  response: UserSettings | (Err<HttpResponseError> | Ok<IUserDto<UserProfile>>),
): response is UserSettings => {
  return (response as UserSettings).workspaceFontSize !== undefined;
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default combineEpics(
  fetchUserEpic,
  updateUserEpic,
  updateUserSettingsEpic,
);
