import {
  Challenge,
  CourseSkeletonList,
  CourseList,
  PortfolioSkillSummaryMap,
  portfolioSkillsList,
} from "../types/courses";
import { UserProfile, UserProgressMap } from "../types/dto";

/**
 * Assert a condition cannot occur. Used for writing exhaustive switch
 * blocks guarantee every value is handled.
 */
export const assertUnreachable = (x: never): never => {
  throw new Error(
    `Panic! Received a value which should not exist: ${JSON.stringify(x)}`,
  );
};

// NOTE: We leave spaces in initially so that we can split on them
// NOTE: The alphanumeric logic DOES NOT necessarily work outside of English
// (this would demolish Chinese URLs). Just a consideration.
export const sluggify = (s: string) => {
  return s
    .toLowerCase()
    .split(" ")
    .map((x) => x.replace(/[^A-Za-z0-9]/g, "").trim()) //  Replace non alphanumeric chars except space. See NOTE
    .filter(Boolean)
    .join("-");
};

// NOTE: I'm not using the challenge type because I don't care about the other
// props. It doesn't actually need to be a challenge
export const getChallengeSlug = ({
  id,
  title,
}: {
  id: string;
  title: string;
}) => {
  return `${id}/${sluggify(title)}`;
};

export interface InverseChallengeMapping {
  [k: string]: {
    courseId: string;
    moduleId: string;
    challenge: Challenge;
  };
}

/**
 * Given a list of courses, create a mapping of all challenge ids to both their
 * module id and course id. Since our URLs don't (currently) indicate course or
 * module we need to derive the course and module for a given challenge ID. This
 * derives all such relationships in one go so it can be referenced later.
 */
export const createInverseChallengeMapping = (
  courses: CourseList | CourseSkeletonList,
): InverseChallengeMapping => {
  // @ts-ignore - ignore to allow initial argument to be course or skeleton list
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
            challenge,
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

/**
 * Do not allow a user to disconnect all their social accounts without
 * a verified email.
 */
export const canDisconnectAccountRequest = (profile: UserProfile) => {
  const { emailVerified, googleAccountId, githubAccountId, facebookAccountId } =
    profile;

  const count = (id: string | null): number => (id === null ? 0 : 1);
  const counts = [googleAccountId, githubAccountId, facebookAccountId]
    .map(count)
    .reduce((total, x) => total + x, 0);

  if (counts === 1 && !emailVerified) {
    return false;
  }

  return true;
};

/**
 * Generate default skills summary.
 */
export const getPortfolioSkillsDefaultSummary =
  (): PortfolioSkillSummaryMap => {
    return portfolioSkillsList.slice().reduce((summary, skill) => {
      return {
        ...summary,
        [skill]: {
          total: 0,
          accomplished: 0,
        },
      };
    }, {} as PortfolioSkillSummaryMap);
  };

/**
 * Derive the total skills summary for a user given their progress and
 * all the course content.
 */
export const computePortfolioSkillsSummary = (
  challengeMap: InverseChallengeMapping,
  userProgress: UserProgressMap,
) => {
  const skillsSummary = getPortfolioSkillsDefaultSummary();

  for (const [id, mapEntry] of Object.entries(challengeMap)) {
    const { challenge } = mapEntry;

    if (challenge.skillTags) {
      for (const skill of challenge.skillTags) {
        skillsSummary[skill].total++;
        const courseProgressEntry = userProgress[mapEntry.courseId];
        if (courseProgressEntry) {
          const challengeProgressEntry = courseProgressEntry[id];
          if (challengeProgressEntry && challengeProgressEntry.complete) {
            skillsSummary[skill].accomplished++;
          }
        }
      }
    }
  }

  return skillsSummary;
};
