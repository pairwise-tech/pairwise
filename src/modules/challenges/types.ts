/** ===========================================================================
 * Type Definitions
 * ============================================================================
 */

export type CHALLENGE_TYPE = "react" | "typescript" | "markup";

export interface Course {
  id: string;
  challenges: ChallengeList;
}

export interface Challenge {
  id: string;
  title: string;
  content: string;
  testCode: string;
  videoUrl?: string;
  starterCode: string;
  solutionCode: string;
  type: CHALLENGE_TYPE;
  supplementaryContent: string;
}

type ChallengeList = ReadonlyArray<Challenge>;

/* Map of course ids to lists of challenges */
export type ChallengeDictionary = Map<string, ChallengeList>;

export interface ChallengeContentSkeleton {
  id: string;
  type: string;
  title: string;
}

/* TODO: Fill in types: */
interface CourseContent {
  id: string;
  summaryVideo: any;
  challengeContent: ReadonlyArray<ChallengeContentSkeleton>;
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
