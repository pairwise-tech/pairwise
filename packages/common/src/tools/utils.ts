import { Course } from "../types/courses";

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
    .map(x => x.replace(/[^A-Za-z0-9]/g, "").trim()) //  Replace non alphanumeric chars except space. See NOTE
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
    challenge: {
      id: string;
      title: string;
    };
  };
}

/**
 * Given a list of courses, create a mapping of all challenge ids to both their
 * module id and course id. Since our URLs don't (currently) indicate course or
 * module we need to derive the course and module for a given challenge ID. This
 * derives all such relationships in one go so it can be referenced later.
 */
export const createInverseChallengeMapping = (
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
            challenge: {
              id: challenge.id,
              title: challenge.title,
            },
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
