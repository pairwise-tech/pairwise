import { combineEpics } from "redux-observable";
import { filter, map, mergeMap } from "rxjs/operators";
import { isActionOf } from "typesafe-actions";
import { EpicSignature } from "../root";
import { Actions } from "../root-actions";
import { createInverseChallengeMapping } from "@pairwise/common";

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
 * Fetch the courses.
 */
const challengeInitializationEpic: EpicSignature = (action$, _, deps) => {
  return action$.pipe(
    filter(isActionOf(Actions.initializeAppSuccess)),
    mergeMap(deps.api.fetchCourses),
    map(({ value: courses }) => {
      if (courses) {
        return Actions.fetchCoursesSuccess({ courses });
      } else {
        return Actions.fetchCoursesFailure();
      }
    }),
  );
};

const inverseChallengeMappingEpic: EpicSignature = (action$, state$) => {
  return action$.pipe(
    filter(isActionOf(Actions.fetchCoursesSuccess)),
    map(({ payload: { courses } }) => {
      const challengeMap = createInverseChallengeMapping(courses);
      return Actions.storeInverseChallengeMapping(challengeMap);
    }),
  );
};

/** ===========================================================================
 * Export
 * ============================================================================
 */

export default combineEpics(
  contentSkeletonInitializationEpic,
  challengeInitializationEpic,
  inverseChallengeMappingEpic,
);
