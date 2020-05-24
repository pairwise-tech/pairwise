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
  Challenge,
  getChallengeSlug,
} from "@pairwise/common";
import { combineEpics } from "redux-observable";
import { merge, of, combineLatest, Observable, partition } from "rxjs";
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
import { EpicSignature, ReduxStoreState } from "../root";
import { Actions } from "../root-actions";
import {
  SANDBOX_ID,
  SEARCH,
  SEARCH_SUCCESS,
  BUILD_SEARCH_INDEX,
  SEARCH_QUERY_THRESHOLD,
} from "tools/constants";
import {
  findCourseById,
  deriveIdsFromCourseWithDefaults,
  findChallengeIdInLocationIfExists,
  createInverseChallengeMapping,
  isContentOnlyChallenge,
  getChallengeProgress,
} from "tools/utils";
import { SearchResultEvent } from "./types";

const debug = require("debug")("client:challenges:epics");

/** ===========================================================================
 * Epics
 * ============================================================================
 */

const searchEpic: EpicSignature = action$ => {
  // Initialize the search worker. This could get dropped into deps if we need
  // it elsewhere but I don't think we do
  const searchWorker: Worker = new SearchWorker();

  const buildSearchIndex$ = action$.pipe(
    filter(isActionOf(Actions.fetchCurrentActiveCourseSuccess)),
    map(x => x.payload.courses),
    take(1), // Only do this once.. for now
    tap(courses => {
      searchWorker.postMessage({
        type: BUILD_SEARCH_INDEX,
        payload: courses,
      });
    }),
    ignoreElements(),
  );

  // Stream of incoming search strings that we split on the length of the
  // search. If the search is less than N chars (see below) consider it too
  // small and clear the result so that stale search results aren't hanging
  // around in the UI. Otherwise do the search.
  const [_search$, _clearSearch$] = partition(
    action$.pipe(
      filter(isActionOf(Actions.requestSearchResults)),
      map(x => x.payload),
    ),
    x => x.length > SEARCH_QUERY_THRESHOLD,
  );

  const search$ = _search$.pipe(
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

  const clearSearch$ = _clearSearch$.pipe(
    map(() => []), // Empty array will clear the search
    map(Actions.receiveSearchResults),
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

  return merge(buildSearchIndex$, search$, clearSearch$, searchResult$);
};

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

          const {
            courseId,
            moduleId,
            challengeId,
          } = deriveIdsFromCourseWithDefaults(courses, maybeChallengeId);

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
        deps.toaster.warn(message, { icon: "take-action" });
      }
    }),
    ignoreElements(),
  );
};

/**
 * Can also initialize the challenge id from the url to load the first
 * challenge. Usually challenge ID get set via location change, but in this case
 * the location hasn't change.d
 */
const challengeInitializationEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf([Actions.initializeApp, Actions.logoutUser])),
    mergeMap(deps.api.fetchCourses),
    map(({ value: courses }) => {
      if (courses) {
        const { location } = deps.router;

        const maybeChallengeId = findChallengeIdInLocationIfExists(location);
        const {
          challengeId,
          courseId,
          moduleId,
          slug,
        } = deriveIdsFromCourseWithDefaults(courses, maybeChallengeId);

        // Do not redirect unless the user is already on the workspace/
        if (location.pathname.includes("workspace")) {
          const subPath = slug + location.search + location.hash;
          deps.router.push(`/workspace/${subPath}`);
        }

        return Actions.fetchCurrentActiveCourseSuccess({
          courses,
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
    mergeMap(id => {
      const {
        challengeMap,
        currentCourseId,
        currentModuleId,
        currentChallengeId,
      } = state$.value.challenges;

      // Should not happen, filtered above
      if (!challengeMap) {
        return of(Actions.empty("No challengeMap found"));
      }

      const setChallengeIdAction = Actions.setChallengeId({
        currentChallengeId: id,
        previousChallengeId: currentChallengeId as string /* null is filtered above */,
      });

      // Sandbox is handled directly
      if (id === SANDBOX_ID) {
        return of(setChallengeIdAction);
      }

      const challenge = challengeMap[id];
      const shouldUpdateCurrentCourse =
        currentCourseId !== challenge.courseId ||
        currentModuleId !== challenge.moduleId;

      // I'm not totally sure where this logic should go. The active
      // course needs to be changed if the user selected a challenge not
      // in the current active course. Currently putting this logic here.
      if (shouldUpdateCurrentCourse) {
        return of(
          setChallengeIdAction,
          Actions.setActiveChallengeIds({
            currentChallengeId: id,
            currentModuleId: challenge.moduleId,
            currentCourseId: challenge.courseId,
          }),
        );
      } else {
        return of(setChallengeIdAction);
      }
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
    map(action => {
      const { challengeMap } = state$.value.challenges;
      const challengeId = action.payload.currentChallengeId;
      const slug =
        challengeMap && challengeId in challengeMap
          ? getChallengeSlug(challengeMap[challengeId].challenge)
          : challengeId; // If it doesn't exist that's ok. Client side 404
      const { search = "", hash = "" } = deps.router.location;
      return slug + search + hash;
    }),
    map(subPath => `/workspace/${subPath}`),
    filter(nextPath => {
      return nextPath !== deps.router.location.pathname;
    }),
    tap(nextPath => {
      debug("[INFO setAndSyncChallengeEpic] Redirectin to new path:", nextPath);
      deps.router.push(nextPath);
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
    filter(isActionOf([Actions.setChallengeId, Actions.setActiveChallengeIds])),
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
    // Do not save if the solution code is revealed
    filter(() => !state$.value.challenges.revealWorkspaceSolution),
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
 * NOTE: content only challenges do not have tests, though we still want them to
 * appear as completed in the challenge map. Any time we navigate away from a
 * content only challenge, consider it completed.
 */
const completeContentOnlyChallengeEpic: EpicSignature = (
  action$,
  state$,
  deps,
) => {
  return action$.pipe(
    filter(isActionOf(Actions.setChallengeId)),
    map(({ payload: { previousChallengeId } }) => previousChallengeId),
    map(prevId => {
      // artificially construct the previous state in order to get the last
      // challenge using the getCurrentChallenge selector.
      const prevState = {
        ...state$.value,
        challenges: {
          ...state$.value.challenges,
          currentChallengeId: prevId,
        },
      };
      // it should be impossible for previousChallengeId to be null
      // or empty so it should be safe to cast this as a Challenge
      return deps.selectors.challenges.getCurrentChallenge(
        prevState,
      ) as Challenge;
    }),
    filter(isContentOnlyChallenge),
    map(({ id }) => constructProgressDto(state$.value, id, true)),
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
 * Handle attempting a challenge. This epic constructs a user progress update
 * after a challenge is attempted and then dispatches an action to save this
 * progress update. If challenge is complete (all tests passed), we mark the
 * challenge as completed, if there are failing tests, mark it as attempted.
 */
const handleAttemptChallengeEpic: EpicSignature = (action$, state$) => {
  return action$.pipe(
    filter(isActionOf(Actions.handleAttemptChallenge)),
    // Do not save if solution code is revealed
    filter(() => !state$.value.challenges.revealWorkspaceSolution),
    pluck("payload"),
    map(({ challengeId, complete }) =>
      constructProgressDto(state$.value, challengeId, complete),
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
const updateUserProgressEpic: EpicSignature = (action$, state$, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.updateUserProgress)),
    filter(({ payload }) => {
      // Only update the progress if the challenge is NOT already complete.
      const { progress } = state$.value.user.user;
      const { challengeId, courseId } = payload;
      const challengeProgress = getChallengeProgress(
        progress,
        courseId,
        challengeId,
      );
      return challengeProgress !== "COMPLETE";
    }),
    pluck("payload"),
    mergeMap(deps.api.updateUserProgress),
    map(result => {
      if (result.value) {
        return Actions.updateUserProgressSuccess(result.value);
      } else {
        return Actions.updateUserProgressFailure(result.error);
      }
    }),
  );
};

/** ===========================================================================
 * Utils
 * ============================================================================
 */

const constructProgressDto = (
  state: ReduxStoreState,
  challengeId: string,
  complete: boolean,
): Result<IProgressDto, string> => {
  const courseId = state.challenges.currentCourseId;
  if (courseId) {
    const payload: IProgressDto = {
      courseId,
      complete,
      challengeId,
    };

    return new Ok(payload);
  } else {
    const msg =
      "[WARNING!]: No active course id found in challenge completion epic, this shouldn't happen...";
    console.warn(msg);
    return new Err(msg);
  }
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
  handleAttemptChallengeEpic,
  updateUserProgressEpic,
  searchEpic,
  completeContentOnlyChallengeEpic,
);
