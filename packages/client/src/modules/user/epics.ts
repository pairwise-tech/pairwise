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

const updateUserSettingsFromEditorOptionsEpic: EpicSignature = (
  actions$,
  _,
  deps,
) => {
  return actions$.pipe(
    filter(isActionOf(Actions.updateEditorOptions)),
    map(({ payload }) => {
      return Actions.updateUserSettings({
        workspaceFontSize: payload.fontSize,
      });
    }),
  );
};

const updateUserSettingsEpic: EpicSignature = (action$, state$, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.updateUserSettings)),
    map(({ payload }) => ({ ...state$.value.user.settings, ...payload })),
    mergeMap(API.updateUserSettings),
    map(result => {
      if (result.value) {
        return Actions.updateUserSettingsSuccess(result.value.settings);
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
  updateUserSettingsEpic,
  updateUserSettingsFromEditorOptionsEpic,
);
