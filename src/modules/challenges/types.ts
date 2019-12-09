/** ===========================================================================
 * Type Definitions
 * ============================================================================
 */

export type CHALLENGE_TYPE = "react" | "typescript";

export interface Course {
  id: string;
  challenges: ChallengeList;
}

export interface Challenge {
  id: string;
  title: string;
  content: string;
  testCode: string;
  starterCode: string;
  solutionCode: string;
  type: CHALLENGE_TYPE;
}

type ChallengeList = ReadonlyArray<Challenge>;

/* Map of course ids to lists of challenges */
export type ChallengeDictionary = Map<string, ChallengeList>;

interface ChallengeContentSkeleton {
  id: string;
  type: string;
  title: string;
}

/* TODO: Fill in types: */
interface CourseContent {
  id: string;
  summaryVideo: any;
  challengeContent: ChallengeContentSkeleton;
  projectContent: any;
  projectSolution: any;
  specialTopics: any;
}

interface CourseMetaInformation {
  id: string;
  title: string;
  courseContent: CourseContent;
}

export type NavigationSkeleton = ReadonlyArray<CourseMetaInformation>;
