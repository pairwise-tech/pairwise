import { Course } from "@pairwise/common";
import { combineEpics } from "redux-observable";
import { merge, of } from "rxjs";
import { catchError, delay, filter, map, mergeMap, tap } from "rxjs/operators";
import { isActionOf } from "typesafe-actions";
import { EpicSignature } from "../root";
import { Actions } from "../root-actions";
import { InverseChallengeMapping } from "./types";
import { SANDBOX_ID } from "tools/constants";
import { Location } from "history";

/** ===========================================================================
 * Epics
 * ============================================================================
 */

export const CURRENT_ACTIVE_CHALLENGE_IDS = {
  challengeId: "9scykDold",
};

/**
 * Given a list of courses, create a mapping of all challenge ids to both their
 * module id and course id. Since our URLs don't (currently) indicate course or
 * module we need to derive the course and module for a given challenge ID. This
 * dervices all such relationships in one go so it can be referenced later.
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
        /* Ok ... */
        const maybeId = challengeIdFromLocation(deps.router.location);

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
        if (deps.router.location.pathname.includes("workspace")) {
          deps.router.push(`/workspace/${challengeId}`);
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
      return Actions.setChallengeId(id);
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

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default combineEpics(
  inverseChallengeMappingEpic,
  saveCourse,
  setWorkspaceLoadedEpic,
  challengeInitializationEpic,
  syncChallengeToUrlEpic,
);
