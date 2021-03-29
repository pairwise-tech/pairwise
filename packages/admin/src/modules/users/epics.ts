import { combineEpics } from "redux-observable";
import { filter, ignoreElements, map, mergeMap } from "rxjs/operators";
import { isActionOf } from "typesafe-actions";
import API from "modules/api";
import { EpicSignature } from "../root";
import { Actions } from "../root-actions";

/** ===========================================================================
 * Epics
 * ============================================================================
 */

const fetchUsersEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(
      isActionOf([
        Actions.fetchUsers,
        Actions.refreshStats,
        Actions.fetchAdminUserSuccess,
      ]),
    ),
    mergeMap(API.fetchUsersList),
    map(result => {
      if (result.value) {
        return Actions.fetchUsersSuccess(result.value);
      } else {
        return Actions.fetchUsersFailure(result.error);
      }
    }),
  );
};

const emailMigrationEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.emailMigration)),
    mergeMap(API.emailMigration),
    map(() => deps.toaster.success("Success!")),
    ignoreElements(),
  );
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default combineEpics(fetchUsersEpic, emailMigrationEpic);
