// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax
import SearchWorker from "workerize-loader!tools/lunr-search-worker";

import {
  Course,
  IProgressDto,
  Err,
  Ok,
  Result,
  ICodeBlobDto,
  SandboxBlob,
} from "@pairwise/common";
import { combineEpics } from "redux-observable";
import { merge, of, combineLatest, Observable } from "rxjs";
import {
  catchError,
  delay,
  filter,
  map,
  mergeMap,
  tap,
  pluck,
  ignoreElements,
  debounceTime,
  distinctUntilChanged,
  take,
} from "rxjs/operators";
import { isActionOf } from "typesafe-actions";
import { EpicSignature } from "../root";
import { Actions } from "../root-actions";
import {
  SANDBOX_ID,
  SEARCH,
  SEARCH_SUCCESS,
  BUILD_SEARCH_INDEX,
} from "tools/constants";
import {
  findCourseById,
  deriveIdsFromCourse,
  findChallengeIdInLocationIfExists,
  createInverseChallengeMapping,
} from "tools/utils";
import { SearchResultEvent } from "./types";

const debug = require("debug")("challenges:epics");

const searchEpic: EpicSignature = action$ => {
  // Initialize the search worker. This could get dropped into deps if we need
  // it elsewhere but I don't think we do
  const searchWorker: Worker = new SearchWorker();

  // NOTE: Currently we're only using one course... so the search index will
  // only search over the first course fetched. As of 2020-03-03 we only have
  // one course and only fetch one course but might need to revisit in the
  // future
  const buildSearchIndex$ = action$.pipe(
    filter(isActionOf(Actions.fetchCurrentActiveCourseSuccess)),
    map(x => x.payload.courses[0]), // See NOTE
    take(1), // Only do this once.. for now
    tap(course => {
      searchWorker.postMessage({
        type: BUILD_SEARCH_INDEX,
        payload: course,
      });
    }),
    ignoreElements(),
  );

  // Stream of incoming search strings
  const search$ = action$.pipe(
    filter(isActionOf(Actions.requestSearchResults)),
    map(x => x.payload),
    filter(x => x.length > 2), // This is arbitrary. Maybe it should just be > 1?
    distinctUntilChanged(),
    debounceTime(200),
    tap(x => {
      searchWorker.postMessage({
        type: SEARCH,
        payload: x,
      });
    }),
    ignoreElements(),
  );

  // All search results from the worker.
  // NOTE: Since this is async the way it's current written there is no
  // guarantee the most recent search result we get back corresponds to the most
  // recent string the user has typed
  const searchResult$ = new Observable<SearchResultEvent>(obs => {
    const listener = (message: SearchResultEvent) => obs.next(message);
    searchWorker.addEventListener("message", listener);
    return () => searchWorker.removeEventListener("message", listener);
  }).pipe(
    tap(message => {
      // This is the stream of all messages from the worker before it's filtered
      debug("[INFO searchWorker]", message);
    }),
    map(x => x.data),
    filter(x => x.type === SEARCH_SUCCESS),
    map(x => x.payload),
    map(Actions.receiveSearchResults),
  );

  return merge(buildSearchIndex$, search$, searchResult$);
};

/** ===========================================================================
 * Epics
 * ============================================================================
 */

/**
 * Fetch the course content skeletons when the app launches.
 */
const contentSkeletonInitializationEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.initializeApp)),
    mergeMap(deps.api.fetchCourseSkeletons),
    map(({ value: courses, error }) => {
      if (courses) {
        return Actions.fetchNavigationSkeletonSuccess(courses);
      } else {
        return Actions.fetchNavigationSkeletonFailure(error);
      }
    }),
  );
};

/**
 * Some state changes result in a need to reset the ids for the active
 * course, module, or challenge. This epic is used to do that.
 */
const resetActiveChallengeIds: EpicSignature = (action$, state$, deps) => {
  return action$.pipe(
    filter(isActionOf([Actions.deleteChallenge, Actions.deleteCourseModule])),
    map(() => {
      const { courses, currentCourseId } = state$.value.challenges;

      if (currentCourseId && courses) {
        const course = findCourseById(currentCourseId, courses);
        if (course) {
          const maybeChallengeId = findChallengeIdInLocationIfExists(
            deps.router.location,
          );

          const { courseId, moduleId, challengeId } = deriveIdsFromCourse(
            course,
            maybeChallengeId,
          );

          return Actions.setActiveChallengeIds({
            currentCourseId: courseId,
            currentModuleId: moduleId,
            currentChallengeId: challengeId,
          });
        }
      }

      return Actions.empty("Tried to set active challenge ids but could not");
    }),
  );
};

/**
 * Show a toast when a module or challenge is deleted for a better UX.
 */
const codepressDeleteToasterEpic: EpicSignature = (action$, state$, deps) => {
  return action$.pipe(
    filter(isActionOf([Actions.deleteChallenge, Actions.deleteCourseModule])),
    tap(action => {
      let message = "";
      if (isActionOf(Actions.deleteChallenge, action)) {
        message = "Challenge deleted successfully!";
      } else if (isActionOf(Actions.deleteCourseModule, action)) {
        message = "Module deleted successfully!";
      }

      if (message) {
        deps.toaster.warn(message, "take-action");
      }
    }),
    ignoreElements(),
  );
};

/**
 * Can also initialize the challenge id from the url to load the first
 * challenge.
 */
const challengeInitializationEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf([Actions.initializeApp, Actions.logoutUser])),
    mergeMap(deps.api.fetchChallenges),
    map(({ value: course }) => {
      if (course) {
        const { location } = deps.router;

        const maybeChallengeId = findChallengeIdInLocationIfExists(location);
        const { challengeId, courseId, moduleId } = deriveIdsFromCourse(
          course,
          maybeChallengeId,
        );

        // Do not redirect unless the user is already on the workspace/
        if (location.pathname.includes("workspace")) {
          const subPath = challengeId + location.search + location.hash;
          deps.router.push(`/workspace/${subPath}`);
        }

        return Actions.fetchCurrentActiveCourseSuccess({
          courses: [course],
          currentChallengeId: challengeId,
          currentModuleId: moduleId,
          currentCourseId: courseId,
        });
      } else {
        return Actions.fetchCurrentActiveCourseFailure();
      }
    }),
  );
};

const inverseChallengeMappingEpic: EpicSignature = (action$, state$) => {
  return merge(
    action$.pipe(
      filter(isActionOf(Actions.fetchCurrentActiveCourseSuccess)),
      map(({ payload: { courses } }) => {
        const challengeMap = createInverseChallengeMapping(courses);
        return challengeMap;
      }),
    ),
    action$.pipe(
      filter(isActionOf(Actions.createChallenge)),
      map(() => state$.value.challenges.courses),
      filter(x => Boolean(x)),
      map(courses => {
        return createInverseChallengeMapping(
          courses as Course[], // TS doesn't know that this is not null due to filter above
        );
      }),
    ),
  ).pipe(
    map(challengeMap => Actions.storeInverseChallengeMapping(challengeMap)),
  );
};

/**
 * Add a brief pause to display a loading overlay on top of the workspace
 * to allow Monaco to fully initialize.
 */
const setWorkspaceLoadedEpic: EpicSignature = action$ => {
  return action$.pipe(
    filter(isActionOf(Actions.fetchCurrentActiveCourseSuccess)),
    delay(1000),
    map(() => Actions.setWorkspaceChallengeLoaded()),
  );
};

/**
 * Sync the challenge id to the url epic. Allow the workspace url to
 * dictate the current challenge id. This epic responds to location change
 * events and sets the challenge id if needed.
 */
const syncChallengeToUrlEpic: EpicSignature = (action$, state$) => {
  return action$.pipe(
    filter(isActionOf(Actions.locationChange)),
    pluck("payload"),
    map(findChallengeIdInLocationIfExists),
    filter(id => {
      const { challengeMap, currentChallengeId } = state$.value.challenges;
      // Don't proceed if we're lacking an id or the challenge map
      if (!challengeMap || !id) {
        return false;
      }

      const challengeExists = id in challengeMap;
      const isSandbox = id === SANDBOX_ID;
      const shouldUpdate =
        id !== currentChallengeId && (challengeExists || isSandbox);

      return shouldUpdate;
    }),
    map(id => {
      const { currentChallengeId } = state$.value.challenges;
      return Actions.setChallengeId({
        currentChallengeId: id,
        previousChallengeId: currentChallengeId as string /* null is filtered above */,
      });
    }),
  );
};

/**
 * Canonical way to set a new challenge id with an action.
 */
const setAndSyncChallengeIdEpic: EpicSignature = (action$, state$, deps) => {
  return action$.pipe(
    filter(
      isActionOf([
        Actions.setAndSyncChallengeId,
        Actions.setActiveChallengeIds,
      ]),
    ),
    tap(action => {
      deps.router.push(`/workspace/${action.payload.currentChallengeId}`);
    }),
    ignoreElements(),
  );
};

const saveCourse: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.saveCourse)),
    map(x => x.payload),
    mergeMap(payload => {
      return deps.api.codepressApi.save(payload).pipe(
        map(Actions.saveCourseSuccess),
        tap(() => deps.toaster.success("Saved 👍")),
        catchError(err =>
          of(Actions.saveCourseFailure(err)).pipe(
            tap(() => {
              deps.toaster.error("Could not save!");
            }),
          ),
        ),
      );
    }),
  );
};

/**
 * Fetches a code blob for a challenge when the challenge id changes. Code
 * blobs are fetched individually whenever a challenge loads, and then
 * cached locally in Redux state. When a challenge is first viewed, the code
 * blob will be fetched from the API, if the challenge is viewed again, the
 * blob will be fetched from the local Redux blob cache.
 *
 * This epic will receive the current challenge id, and then determine the
 * next and previously challenge ids, and dispatch requests to fetch all
 * of these. This could be adjusted later... but the idea is to try to prefetch
 * the challenge blobs ahead of the user navigating to the challenge. Since
 * the fetch epic always checks the cache first, this should not result in
 * multiple API requests.
 *
 * NOTE: If the API fails to find a blob, it will return a 404 error. This is
 * used to clearly differentiate when the Workspace should default to showing
 * the initial starter code for a challenge (and when instead it should show
 * an empty editor, if, for instance the user cleared all the editor code).
 */
const handleFetchCodeBlobForChallengeEpic: EpicSignature = (
  action$,
  state$,
  deps,
) => {
  // Fetch when navigation changes, i.e. setChallengeId
  const fetchOnNavEpic = action$.pipe(
    filter(isActionOf(Actions.setChallengeId)),
    pluck("payload"),
    pluck("currentChallengeId"),
    mergeMap(id => {
      const { next, prev } = deps.selectors.challenges.nextPrevChallenges(
        state$.value,
      );

      const actions = [Actions.fetchBlobForChallenge(id)];

      if (next) {
        actions.push(Actions.fetchBlobForChallenge(next.id));
      }

      if (prev) {
        actions.push(Actions.fetchBlobForChallenge(prev.id));
      }

      return of(...actions);
    }),
  );

  // Fetch on challenge initialization which does not fire a setChallengeId action
  const fetchOnChallengeInitEpic = action$.pipe(
    filter(isActionOf(Actions.fetchCurrentActiveCourseSuccess)),
    map(x => x.payload.currentChallengeId),
    map(Actions.fetchBlobForChallenge),
  );

  return merge(fetchOnNavEpic, fetchOnChallengeInitEpic);
};

/**
 * Handle actually fetching the code blob. Check the cache first, otherwise
 * fetch it from the API.
 */
const fetchCodeBlobForChallengeEpic: EpicSignature = (
  action$,
  state$,
  deps,
) => {
  return action$.pipe(
    filter(isActionOf(Actions.fetchBlobForChallenge)),
    pluck("payload"),
    mergeMap(async id => {
      const blobCache = state$.value.challenges.blobCache;
      if (id in blobCache) {
        return new Ok({
          challengeId: id,
          dataBlob: blobCache[id],
        });
      } else {
        return deps.api.fetchChallengeHistory(id);
      }
    }),
    map(result => {
      if (result.value) {
        return Actions.fetchBlobForChallengeSuccess(result.value);
      } else {
        return Actions.fetchBlobForChallengeFailure(result.error);
      }
    }),
  );
};

/**
 * Initialize the sandbox with whatever challenge type was stored locally. This
 * is so you can select a sandbox challenge type and have that type remain on
 * page reload.
 *
 * The underlying reason this is necessary is that the workspace will look at
 * challenge.type rather than blob.challengeType when determining what type of
 * code is running. With normal challenges this is fine, the type never changes
 * except in edit mode, but the sandbox is a special case.
 *
 * @NOTE The workspace will throw an error if we fire an update challenge action
 * before it is loaded, so combine latest is just used to ensure that the update
 * is not fired before the workspace is ready
 */
const hydrateSandboxType: EpicSignature = action$ => {
  // See NOTE
  const workspaceLoaded$ = action$.pipe(
    filter(isActionOf(Actions.setWorkspaceChallengeLoaded)),
  );
  const sandboxCodeFetched$ = action$.pipe(
    filter(isActionOf(Actions.fetchBlobForChallengeSuccess)),
    filter(x => x.payload.challengeId === "sandbox"),
  );

  return combineLatest(workspaceLoaded$, sandboxCodeFetched$).pipe(
    map(([_, x]) => x.payload),
    map(x => {
      const blob = x.dataBlob as SandboxBlob;
      return Actions.updateChallenge({
        id: SANDBOX_ID,
        challenge: {
          type: blob.challengeType,
        },
      });
    }),
  );
};

/**
 * Handles saving a code blob, this occurs whenever the challenge id changes
 * and it saves the code blob for the previous challenge. This epic just
 * finds the blob to save and then dispatches the action which actually saves
 * the blob.
 */
const handleSaveCodeBlobEpic: EpicSignature = (action$, state$, deps) => {
  const saveOnNavEpic = action$.pipe(
    filter(isActionOf(Actions.setChallengeId)),
    pluck("payload"),
    pluck("previousChallengeId"),
    map(challengeId => {
      const blobs = deps.selectors.challenges.getBlobCache(state$.value);
      if (challengeId in blobs) {
        const codeBlob: ICodeBlobDto = {
          challengeId,
          dataBlob: blobs[challengeId],
        };
        return new Ok(codeBlob);
      } else {
        return new Err("No blob found");
      }
    }),
    map(result => {
      if (result.value) {
        return Actions.saveChallengeBlob(result.value);
      } else {
        return Actions.empty("No blob saved");
      }
    }),
  );

  const saveOnUpdateEpic = action$.pipe(
    filter(isActionOf(Actions.updateCurrentChallengeBlob)),
    debounceTime(500),
    map(x => x.payload),
    map(Actions.saveChallengeBlob),
  );

  return merge(saveOnNavEpic, saveOnUpdateEpic);
};

/**
 * Save a code blob. Just take the blob and send it to the API to be saved.
 */
const saveCodeBlobEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.saveChallengeBlob)),
    pluck("payload"),
    mergeMap(deps.api.updateChallengeHistory),
    map(result => {
      if (result.value) {
        return Actions.saveChallengeBlobSuccess();
      } else {
        return Actions.saveChallengeBlobFailure(result.error);
      }
    }),
  );
};

/**
 * Handle completing a challenge (all tests passed). This epic constructs
 * a user progress update after a challenge is passed and then dispatches an
 * action to save this progress update.
 */
const handleCompleteChallengeEpic: EpicSignature = (action$, state$, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.handleCompleteChallenge)),
    map(x => x.payload),
    map(
      (challengeId): Result<IProgressDto, string> => {
        const courseId = state$.value.challenges.currentCourseId;

        if (courseId) {
          const payload: IProgressDto = {
            courseId,
            challengeId,
            complete: true,
          };

          return new Ok(payload);
        } else {
          const msg =
            "[WARNING!]: No active course id found in handleCompleteChallengeEpic, this shouldn't happen...";
          console.warn(msg);
          return new Err(msg);
        }
      },
    ),
    map(result => {
      if (result.value) {
        return Actions.updateUserProgress(result.value);
      } else {
        return Actions.empty("Did not save user progress");
      }
    }),
  );
};

/**
 * Handle saving a user progress update. Just send the progress update
 * to the API to be saved.
 */
const updateUserProgressEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.updateUserProgress)),
    pluck("payload"),
    mergeMap(deps.api.updateUserProgress),
    map(result => {
      if (result.value) {
        return Actions.updateUserProgressSuccess();
      } else {
        return Actions.updateUserProgressFailure(result.error);
      }
    }),
  );
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default combineEpics(
  hydrateSandboxType,
  contentSkeletonInitializationEpic,
  inverseChallengeMappingEpic,
  saveCourse,
  handleFetchCodeBlobForChallengeEpic,
  fetchCodeBlobForChallengeEpic,
  setWorkspaceLoadedEpic,
  resetActiveChallengeIds,
  codepressDeleteToasterEpic,
  challengeInitializationEpic,
  setAndSyncChallengeIdEpic,
  syncChallengeToUrlEpic,
  handleSaveCodeBlobEpic,
  saveCodeBlobEpic,
  handleCompleteChallengeEpic,
  updateUserProgressEpic,
  searchEpic,
);
