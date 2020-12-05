import { CourseList, LastActiveChallengeIds } from "@pairwise/common";
import { combineEpics } from "redux-observable";
import { of, combineLatest } from "rxjs";
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
import { SANDBOX_ID } from "tools/constants";
import {
  deriveIdsFromCourseWithDefaults,
  findChallengeIdInLocationIfExists,
} from "tools/utils";
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
    map(x => x.payload.courses),
  );

  const fetchUser$ = action$.pipe(
    filter(isActionOf(Actions.fetchAdminUserSuccess)),
    map(x => x.payload.lastActiveChallengeIds),
  );

  return combineLatest(fetchCourses$, fetchUser$).pipe(
    mergeMap(
      ([courses, lastActiveIds]: [CourseList, LastActiveChallengeIds]) => {
        const { location } = deps.router;

        const lastActiveId = lastActiveIds.lastActiveChallenge;
        const deepLinkChallengeId = findChallengeIdInLocationIfExists(location);
        const activeChallengeId = deepLinkChallengeId || lastActiveId || null;
        const {
          slug,
          courseId,
          moduleId,
          challengeId,
        } = deriveIdsFromCourseWithDefaults(courses, activeChallengeId);

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
  initializeChallengeStateEpic,
  setWorkspaceLoadedEpic,
  lostUserEpic,
  challengeInitializationEpic,
  syncChallengeContextToUrlEpic,
  showSectionToastEpic,
);
