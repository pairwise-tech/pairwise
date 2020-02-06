import {
  Course,
  IProgressDto,
  Err,
  Ok,
  Result,
  ICodeBlobDto,
} from "@pairwise/common";
import { combineEpics } from "redux-observable";
import { merge, of } from "rxjs";
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
} from "rxjs/operators";
import { isActionOf, action } from "typesafe-actions";
import { EpicSignature } from "../root";
import { Actions } from "../root-actions";
import { InverseChallengeMapping } from "./types";
import { SANDBOX_ID } from "tools/constants";
import { Location } from "history";

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
 * Given a list of courses, create a mapping of all challenge ids to both their
 * module id and course id. Since our URLs don't (currently) indicate course or
 * module we need to derive the course and module for a given challenge ID. This
 * devices all such relationships in one go so it can be referenced later.
 */
const createInverseChallengeMapping = (
  courses: Course[],
): InverseChallengeMapping => {
  const result = courses.reduce((challengeMap, c) => {
    const courseId = c.id;
    const cx = c.modules.reduce((courseChallengeMap, m) => {
      const moduleId = m.id;
      const mx = m.challenges.reduce((moduleChallengeMap, challenge) => {
        return {
          ...moduleChallengeMap,
          [challenge.id]: {
            moduleId,
            courseId,
          },
        };
      }, {});

      return {
        ...courseChallengeMap,
        ...mx,
      };
    }, {});

    return {
      ...challengeMap,
      ...cx,
    };
  }, {});

  return result;
};

const challengeIdFromLocation = ({ pathname }: Location) => {
  return pathname.replace("/workspace/", "");
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
        const { router } = deps;
        /* Ok ... */
        const maybeId = challengeIdFromLocation(router.location);

        const challengeMap = createInverseChallengeMapping([course]);
        const challengeId =
          maybeId in challengeMap
            ? maybeId
            : maybeId === SANDBOX_ID
            ? maybeId
            : course.modules[0].challenges[0].id;
        const courseId = challengeMap[challengeId]?.courseId || course.id;
        const moduleId =
          challengeMap[challengeId]?.moduleId || course.modules[0].id;

        // Do not redirect unless the user is already on the workspace/
        if (router.location.pathname.includes("workspace")) {
          const subPath =
            challengeId + router.location.search + router.location.hash;
          router.push(`/workspace/${subPath}`);
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

const syncChallengeToUrlEpic: EpicSignature = (action$, state$) => {
  return action$.pipe(
    filter(isActionOf(Actions.locationChange)),
    map(x => challengeIdFromLocation(x.payload)),
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
        newChallengeId: id,
        previousChallengeId: currentChallengeId as string /* null is filtered above */,
      });
    }),
  );
};

const saveCourse: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.saveCourse)),
    map(x => x.payload),
    mergeMap(payload => {
      return deps.api.codepressApi.save(payload).pipe(
        map(Actions.saveCourseSuccess),
        tap(() =>
          deps.toaster.show({
            message: "Saved 👍",
            intent: "success",
            icon: "tick",
          }),
        ),
        catchError(err =>
          of(Actions.saveCourseFailure(err)).pipe(
            tap(() => {
              deps.toaster.show({
                message: "Could not save!",
                intent: "danger",
                icon: "error",
              });
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
    pluck("newChallengeId"),
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
    mergeMap(result => {
      if (result.value) {
        return [
          Actions.fetchBlobForChallengeSuccess(result.value),
          // Actions.updateCurrentChallengeBlob(result.value),
        ];
      } else {
        return of(Actions.fetchBlobForChallengeFailure(result.error));
      }
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

const sandboxPersistenceEpic: EpicSignature = (action$, state$, deps) => {
  const storeSandboxCodeEpic = action$.pipe(
    filter(isActionOf(Actions.updateChallenge)),
    filter(x => x.payload.id === SANDBOX_ID),
    map(x => x.payload.challenge.starterCode),
    tap(code => {
      console.log("code coming through", code);
    }),
    ignoreElements(),
  );

  return storeSandboxCodeEpic;
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default combineEpics(
  contentSkeletonInitializationEpic,
  inverseChallengeMappingEpic,
  saveCourse,
  handleFetchCodeBlobForChallengeEpic,
  fetchCodeBlobForChallengeEpic,
  setWorkspaceLoadedEpic,
  challengeInitializationEpic,
  syncChallengeToUrlEpic,
  handleSaveCodeBlobEpic,
  saveCodeBlobEpic,
  handleCompleteChallengeEpic,
  updateUserProgressEpic,
);
