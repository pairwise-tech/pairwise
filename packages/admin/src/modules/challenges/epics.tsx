import { combineEpics } from "redux-observable";
import {
  delay,
  filter,
  map,
  mergeMap,
  tap,
  pluck,
  ignoreElements,
} from "rxjs/operators";
import { isActionOf } from "typesafe-actions";
import { EpicSignature } from "../root";
import { Actions } from "../root-actions";
import React from "react";

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
    filter(isActionOf([Actions.initializeApp, Actions.logoutUser])),
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

/**
 * Add a brief pause to display a loading overlay on top of the workspace
 * to allow Monaco to fully initialize.
 */
const setWorkspaceLoadedEpic: EpicSignature = action$ => {
  return action$.pipe(
    filter(isActionOf(Actions.fetchCoursesSuccess)),
    delay(1000),
    map(() => Actions.setWorkspaceChallengeLoaded()),
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
    map(previousChallengeId => {
      const {
        currentCourseId,
        currentModuleId,
        courseSkeletons,
      } = state$.value.challenges;

      const challenges = courseSkeletons
        ?.find(({ id }) => id === currentCourseId)
        ?.modules.find(({ id }) => id === currentModuleId)?.challenges;

      if (challenges) {
        return {
          challenges,
          prevChallengeIndex: challenges.findIndex(
            c => c.id === previousChallengeId,
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
                  display: "inline-block",
                  height: 10,
                  transform: "translateY(-5px) scale(2.5)",
                  paddingLeft: 13,
                  paddingRight: 15,
                }}
                src={require("../../icons/partyparrot.gif")}
                alt="Party Parrot"
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
 * Export
 * ============================================================================
 */

export default combineEpics(
  contentSkeletonInitializationEpic,
  setWorkspaceLoadedEpic,
  challengeInitializationEpic,
  showSectionToastEpic,
);
