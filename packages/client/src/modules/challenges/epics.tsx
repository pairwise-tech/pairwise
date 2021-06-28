// @ts-ignore
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
  createInverseChallengeMapping,
  CourseList,
  LastActiveChallengeIds,
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
  pairwise,
  withLatestFrom,
} from "rxjs/operators";
import { isActionOf, PayloadAction } from "typesafe-actions";
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
  deriveIdsFromCourseWithDefaults,
  findChallengeIdInLocationIfExists,
  isContentOnlyChallenge,
  getChallengeProgress,
} from "tools/utils";
import { SearchResultEvent } from "./types";
import React from "react";
import PartyParrot from "../../icons/partyparrot.gif";

/** ===========================================================================
 * Epics
 * ============================================================================
 */

const searchEpic: EpicSignature = (action$) => {
  // Initialize the search worker. This could get dropped into deps if we need
  // it elsewhere but I don't think we do
  const searchWorker: Worker = new SearchWorker();

  const buildSearchIndex$ = action$.pipe(
    filter(isActionOf(Actions.fetchCoursesSuccess)),
    map((x) => x.payload.courses),
    take(1), // Only do this once.. for now
    tap((courses) => {
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
      map((x) => x.payload),
    ),
    (x) => x.length > SEARCH_QUERY_THRESHOLD,
  );

  const search$ = _search$.pipe(
    distinctUntilChanged(),
    debounceTime(200),
    tap((x) => {
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
  const searchResult$ = new Observable<SearchResultEvent>((obs) => {
    const listener = (message: SearchResultEvent) => obs.next(message);
    searchWorker.addEventListener("message", listener);
    return () => searchWorker.removeEventListener("message", listener);
  }).pipe(
    tap((message) => {
      // This is the stream of all messages from the worker before it's filtered
    }),
    map((x) => x.data),
    filter((x) => x.type === SEARCH_SUCCESS),
    map((x) => x.payload),
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
 * After a challenge or module is deleted when running Codepress, some side
 * effects are required. This epic takes care of that: updating the URL and
 * triggering the setChallengeIdContext actions to indicate the challenge id
 * context has changed.
 */
const resetChallengeContextAfterDeletionEpic: EpicSignature = (
  action$,
  state$,
  deps,
) => {
  return action$.pipe(
    filter(isActionOf([Actions.deleteChallenge, Actions.deleteCourseModule])),
    map(() => {
      const {
        courses,
        challengeMap,
        currentCourseId,
        currentModuleId,
        currentChallengeId,
      } = state$.value.challenges;

      if (currentCourseId && currentModuleId && courses) {
        const { location } = deps.router;

        if (currentChallengeId && challengeMap) {
          const slug = getChallengeSlug(
            challengeMap[currentChallengeId].challenge,
          );
          if (slug) {
            const subPath = slug + location.search + location.hash;
            deps.router.push(`/workspace/${subPath}`);
          }
        } else {
          /**
           * NOTE: The context reset logic in the challenges store resets the
           * challenge id to the previous challenge. If it's the first
           * challenge in the list, this will result in null in which case we
           * just redirect /home.
           *
           * This handles the edge cases of deleting the first challenge
           * and having a challenge list of only 1 challenge, which is then
           * deleted.
           */
          deps.toaster.warn(
            "Could not find challenge to redirect to after deletion, redirecting home instead.",
          );
          deps.router.push(`/home`);
        }

        return Actions.setChallengeIdContext({
          currentCourseId,
          currentModuleId,
          currentChallengeId,
          previousChallengeId: null,
        });
      }

      return Actions.empty(
        "Failed to reset challenge context correctly after deletion action.",
      );
    }),
  );
};

/**
 * Show a toast when a module or challenge is deleted for a better UX.
 */
const codepressDeleteToasterEpic: EpicSignature = (action$, state$, deps) => {
  return action$.pipe(
    filter(isActionOf([Actions.deleteChallenge, Actions.deleteCourseModule])),
    tap((action) => {
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
 * Fetch the courses.
 */
const challengeInitializationEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf([Actions.initializeApp, Actions.logoutUser])),
    mergeMap(deps.api.fetchCourses),
    map((result) => {
      if (result.value) {
        return Actions.fetchCoursesSuccess({ courses: result.value });
      } else {
        return Actions.fetchCoursesFailure(result.error);
      }
    }),
  );
};

/**
 * Handle initializing the challenge context. This epic will determine an
 * active challenge based on the current url first and the last active
 * challenge second. If these don't exist, the current challenge ID will
 * be null.
 *
 * The Redirect will only occur if user is on /workspace/ and there is an
 * active challenge.
 */
const initializeChallengeStateEpic: EpicSignature = (action$, _, deps) => {
  const fetchCourses$ = action$.pipe(
    filter(isActionOf(Actions.fetchCoursesSuccess)),
    map((x) => x.payload.courses),
  );

  const fetchUser$ = action$.pipe(
    filter(isActionOf(Actions.fetchUserSuccess)),
    map((x) => x.payload.lastActiveChallengeIds),
  );

  return combineLatest([fetchCourses$, fetchUser$]).pipe(
    mergeMap(
      ([courses, lastActiveIds]: [CourseList, LastActiveChallengeIds]) => {
        const { location } = deps.router;

        const lastActiveId = lastActiveIds.lastActiveChallenge;
        const deepLinkChallengeId = findChallengeIdInLocationIfExists(location);
        const activeChallengeId = deepLinkChallengeId || lastActiveId || null;
        const { slug, courseId, moduleId, challengeId } =
          deriveIdsFromCourseWithDefaults(courses, activeChallengeId);

        // Handle redirects:
        if (location.pathname.includes("workspace")) {
          if (slug) {
            const subPath = slug + location.search + location.hash;
            deps.router.push(`/workspace/${subPath}`);
          } else {
            deps.router.push(`/home`);
          }
        }

        return of(
          Actions.setChallengeIdContext({
            currentCourseId: courseId,
            currentModuleId: moduleId,
            currentChallengeId: challengeId,
            previousChallengeId: null,
          }),
        );
      },
    ),
  );
};

const inverseChallengeMappingEpic: EpicSignature = (action$, state$) => {
  return merge(
    action$.pipe(
      filter(isActionOf(Actions.fetchCoursesSuccess)),
      map(({ payload: { courses } }) => {
        const challengeMap = createInverseChallengeMapping(courses);
        return challengeMap;
      }),
    ),
    action$.pipe(
      filter(isActionOf(Actions.createChallenge)),
      map(() => state$.value.challenges.courses),
      filter((x) => Boolean(x)),
      map((courses) => {
        return createInverseChallengeMapping(
          courses as Course[], // TS doesn't know that this is not null due to filter above
        );
      }),
    ),
  ).pipe(
    map((challengeMap) => Actions.storeInverseChallengeMapping(challengeMap)),
  );
};

/**
 * Add a brief pause to display a loading overlay on top of the workspace
 * to allow Monaco to fully initialize.
 */
const setWorkspaceLoadedEpic: EpicSignature = (action$) => {
  return action$.pipe(
    filter(isActionOf(Actions.fetchCoursesSuccess)),
    delay(1000),
    map(() => Actions.setWorkspaceChallengeLoaded()),
  );
};

/**
 * Handle redirecting the user if the are on the workspace/ route but
 * with an incorrect challenge id, or some other non-workspace valid path.
 */
const lostUserEpic: EpicSignature = (action$, state$, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.storeInverseChallengeMapping)),
    filter(() => {
      return deps.router.location.pathname.includes("workspace");
    }),
    tap(() => {
      const { currentChallengeId, challengeMap } = state$.value.challenges;

      // Sandbox is OK
      if (currentChallengeId === SANDBOX_ID) {
        return;
      }

      if (challengeMap && currentChallengeId) {
        if (!challengeMap[currentChallengeId]) {
          deps.router.push("/404");
        }
      }
    }),
    ignoreElements(),
  );
};

/**
 * Sync the challenge id to the url epic. Allow the workspace url to
 * dictate the current challenge id. This epic responds to location change
 * events and sets the challenge id if needed.
 */
const syncChallengeContextToUrlEpic: EpicSignature = (action$, state$) => {
  return action$.pipe(
    filter(isActionOf(Actions.locationChange)),
    pluck("payload"),
    map(findChallengeIdInLocationIfExists),
    filter((id) => {
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
    mergeMap((id) => {
      const { challengeMap, currentChallengeId } = state$.value.challenges;
      const previousChallengeId = currentChallengeId as string;
      const { currentCourseId, currentModuleId } = state$.value.challenges;

      // Should not happen, current challenge status should exist and
      // is filtered above
      if (!challengeMap || !id || !currentCourseId || !currentModuleId) {
        return of(
          Actions.empty(
            "Failed to sync challenge context to url... some state was missing (should not happen).",
          ),
        );
      }

      // Sandbox gets sandbox challenge id but course/module do not change
      if (id === SANDBOX_ID) {
        return of(
          Actions.setChallengeIdContext({
            currentModuleId,
            currentCourseId,
            previousChallengeId,
            currentChallengeId: SANDBOX_ID,
          }),
        );
      }

      const challenge = challengeMap[id];

      return of(
        Actions.setChallengeIdContext({
          currentChallengeId: id,
          currentModuleId: challenge.moduleId,
          currentCourseId: challenge.courseId,
          previousChallengeId,
        }),
      );
    }),
  );
};

const saveCourse: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.saveCourse)),
    map((x) => x.payload),
    mergeMap((payload) => {
      return deps.api.codepressApi.save(payload).pipe(
        map(Actions.saveCourseSuccess),
        tap(() => deps.toaster.success("Saved 👍")),
        catchError((err) =>
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
  return action$.pipe(
    filter(isActionOf(Actions.setChallengeIdContext)),
    pluck("payload"),
    pluck("currentChallengeId"),
    filter((x) => !!x),
    mergeMap((id) => {
      if (!id) {
        return of(Actions.empty("No challenge id yet..."));
      }

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
    mergeMap(async (id) => {
      const blobCache = state$.value.challenges.blobCache;
      const cachedItem = blobCache[id];

      // If blob is cached return the cached item, otherwise fetch it:
      if (cachedItem && cachedItem.dataBlob) {
        return Actions.fetchBlobForChallengeSuccess({
          challengeId: id,
          dataBlob: cachedItem.dataBlob,
        });
      } else {
        const result = await deps.api.fetchChallengeBlob(id);
        if (result.value) {
          return Actions.fetchBlobForChallengeSuccess(result.value);
        } else {
          return Actions.fetchBlobForChallengeFailure({
            challengeId: id,
            err: result.error,
          });
        }
      }
    }),
  );
};

/**
 * Handle dispatching an update to last active challenge ids whenever the
 * current active challenge changes.
 */
const updateLastActiveChallengeIdsEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.setChallengeIdContext)),
    pluck("payload"),
    filter((x) => x.currentChallengeId !== null),
    filter((x) => x.currentChallengeId !== SANDBOX_ID),
    mergeMap(async ({ currentChallengeId, currentCourseId }) => {
      const challengeId = currentChallengeId as string; // Checked above
      return deps.api.updateLastActiveChallengeIds(
        currentCourseId,
        challengeId,
      );
    }),
    map((result) => {
      if (result.value) {
        return Actions.updateLastActiveChallengeIdsSuccess(result.value);
      } else {
        return Actions.updateLastActiveChallengeIdsFailure();
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
const hydrateSandboxType: EpicSignature = (action$) => {
  // See NOTE
  const workspaceLoaded$ = action$.pipe(
    filter(isActionOf(Actions.setWorkspaceChallengeLoaded)),
  );
  const sandboxCodeFetched$ = action$.pipe(
    filter(isActionOf(Actions.fetchBlobForChallengeSuccess)),
    filter((x) => x.payload.challengeId === "sandbox"),
  );

  return combineLatest([workspaceLoaded$, sandboxCodeFetched$]).pipe(
    map(([_, x]) => x.payload),
    map((x) => {
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
    filter(isActionOf(Actions.setChallengeIdContext)),
    pluck("payload"),
    pluck("previousChallengeId"),
    filter((x) => x !== null),
    map((challengeId) => {
      const id = challengeId as string; // it's not null
      const blobs = deps.selectors.challenges.getBlobCache(state$.value);
      const cachedItem = blobs[id];
      if (cachedItem && cachedItem.dataBlob) {
        const codeBlob: ICodeBlobDto = {
          challengeId: id,
          dataBlob: cachedItem.dataBlob,
        };
        return new Ok(codeBlob);
      } else {
        return new Err("No blob found");
      }
    }),
    map((result) => {
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
    map((x) => x.payload),
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
    map((result) => {
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
    filter(isActionOf(Actions.setChallengeIdContext)),
    pluck("payload"),
    pluck("previousChallengeId"),
    filter((x) => x !== null),
    map((prevId) => {
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
    filter((x) => x.type !== "project"), // Exclude projects
    map(({ id }) => constructProgressDto(state$.value, id, true)),
    map((result) => {
      if (result.value) {
        return Actions.updateUserProgress(result.value);
      } else {
        return Actions.empty("Did not save user progress");
      }
    }),
  );
};

/**
 * Handle saving details for a project submission.
 */
const completeProjectSubmissionEpic: EpicSignature = (action$, state$) => {
  return action$.pipe(
    filter(isActionOf(Actions.submitProject)),
    pluck("payload"),
    filter((x) => x.type === "project"),
    map(({ id }) => constructProgressDto(state$.value, id, true)),
    map((result) => {
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
    filter(() => !state$.value.challenges.revealWorkspaceSolution),
    filter((action) => action.payload.challengeId !== SANDBOX_ID),
    pluck("payload"),
    map(({ challengeId, complete }) =>
      constructProgressDto(state$.value, challengeId, complete),
    ),
    map((result) => {
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
      const { progress } = state$.value.user.user;
      const { challengeId, courseId } = payload;

      // Disregard the Sandbox
      if (challengeId === SANDBOX_ID) {
        return false;
      }

      const challengeProgress = getChallengeProgress(
        progress,
        courseId,
        challengeId,
      );

      // Only update the progress if the challenge is NOT already complete.
      return challengeProgress !== "COMPLETE";
    }),
    pluck("payload"),
    mergeMap(deps.api.updateUserProgress),
    map((result) => {
      if (result.value) {
        return Actions.updateUserProgressSuccess(result.value);
      } else {
        return Actions.updateUserProgressFailure(result.error);
      }
    }),
  );
};

/**
 * If the current challenge is consecutively after the challenge the
 * user is navigating away from, and the current challenge is a section,
 * show a toast to let the user know they have begun a new course section
 */
const showSectionToastEpic: EpicSignature = (action$, state$, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.setChallengeIdContext)),
    pluck("payload"),
    pluck("previousChallengeId"),
    map((previousChallengeId) => {
      const { currentCourseId, currentModuleId, courseSkeletons } =
        state$.value.challenges;

      const challenges = courseSkeletons
        ?.find(({ id }) => id === currentCourseId)
        ?.modules.find(({ id }) => id === currentModuleId)?.challenges;

      if (challenges) {
        return {
          challenges,
          prevChallengeIndex: challenges.findIndex(
            (c) => c.id === previousChallengeId,
          ),
        };
      }

      return { prevChallengeIndex: -1, challenges };
    }),
    filter(
      ({ prevChallengeIndex, challenges }) =>
        prevChallengeIndex !== -1 && challenges !== undefined,
    ),
    tap(({ prevChallengeIndex, challenges }) => {
      const { currentChallengeId } = state$.value.challenges;
      const nextChallenge = challenges && challenges[prevChallengeIndex + 1];
      const isNextConsecutiveChallenge =
        nextChallenge && nextChallenge.id === currentChallengeId;

      if (isNextConsecutiveChallenge && nextChallenge?.type === "section") {
        deps.toaster.toast.show({
          intent: "success",
          message: (
            <span style={{ display: "flex", alignItems: "center" }}>
              <img
                style={{
                  height: 10,
                  paddingLeft: 13,
                  paddingRight: 15,
                  display: "inline-block",
                  transform: "translateY(-5px) scale(2.5)",
                }}
                alt="Party Parrot"
                src={PartyParrot}
              />
              {`Starting section ${nextChallenge.title}!`}
            </span>
          ),
        });
      }
    }),
    ignoreElements(),
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
      timeCompleted: new Date(),
    };

    return new Ok(payload);
  } else {
    const msg =
      "[WARNING!]: No active course id found in challenge completion epic, this shouldn't happen...";
    console.warn(msg);
    return new Err(msg);
  }
};

/**
 * Determine if the course id changed, which can occur from at least two
 * different other actions, and reset the menu selection state if it
 * has changed.
 *
 * This feels rather excessive but it's better than cramming this update
 * logic into the stores and it allows us to use the pairwise operator
 * to compare the current to the previous state.
 */
const resetMenuSelectStateOnCourseChangeEpic: EpicSignature = (
  action$,
  state$,
  deps,
) => {
  // Combine the previous and current state values
  const stateHistory$ = state$.pipe(pairwise());

  return action$.pipe(
    filter(
      isActionOf([Actions.setCurrentCourse, Actions.setChallengeIdContext]),
    ),
    withLatestFrom(stateHistory$),
    filter(([_action, [oldState, newState]]) => {
      const previousCourseId = oldState.challenges.currentCourseId;
      const currentCourseId = newState.challenges.currentCourseId;
      return previousCourseId !== currentCourseId;
    }),
    mergeMap(() => [
      Actions.setMenuSelectColumn("challenges"),
      Actions.setMenuSelectIndex({ challenges: null, modules: null }),
    ]),
  );
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default combineEpics(
  hydrateSandboxType,
  contentSkeletonInitializationEpic,
  initializeChallengeStateEpic,
  inverseChallengeMappingEpic,
  saveCourse,
  handleFetchCodeBlobForChallengeEpic,
  fetchCodeBlobForChallengeEpic,
  completeProjectSubmissionEpic,
  setWorkspaceLoadedEpic,
  lostUserEpic,
  resetChallengeContextAfterDeletionEpic,
  codepressDeleteToasterEpic,
  updateLastActiveChallengeIdsEpic,
  challengeInitializationEpic,
  syncChallengeContextToUrlEpic,
  handleSaveCodeBlobEpic,
  saveCodeBlobEpic,
  handleAttemptChallengeEpic,
  updateUserProgressEpic,
  searchEpic,
  completeContentOnlyChallengeEpic,
  showSectionToastEpic,
  resetMenuSelectStateOnCourseChangeEpic,
);
