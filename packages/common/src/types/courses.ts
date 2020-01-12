/** ===========================================================================
 * Product Curriculum Hierarchy:
 *
 * PRODUCT
 * - Course List (many courses: {id, title, modules})
 *   - Module List (many modules: {id, title, challenges})
 *     - Challenge List (many challenges: {challengeData})
 * ============================================================================
 */

export type CourseList = ReadonlyArray<Course>;

export type CHALLENGE_TYPE = "react" | "typescript" | "markup" | "media";

export interface Course {
  id: string;
  title: string;
  description: string;
  modules: ModuleList;
}

export interface Module {
  id: string;
  title: string;
  free: boolean;
  challenges: ChallengeList;
}

export type ModuleList = ReadonlyArray<Module>;

export interface Challenges {
  id: string;
  type: string;
  title: string;
}

export type ChallengeList = ReadonlyArray<Challenge>;

export interface Challenge {
  type: CHALLENGE_TYPE;
  id: string;
  title: string;
  content: string;
  testCode: string;
  videoUrl?: string;
  starterCode: string;
  solutionCode: string;
  supplementaryContent: string;
}

/**
 * Course skeleton types:
 */

export type CourseSkeletonList = CourseSkeleton[];

export interface CourseSkeleton {
  id: string;
  title: string;
  modules: ModuleSkeletonList;
}

export type ModuleSkeletonList = ModuleSkeleton[];

export interface ModuleSkeleton {
  id: string;
  title: string;
  free: boolean;
  challenges: ChallengeSkeletonList;
}

type ChallengeSkeletonList = ChallengeSkeleton[];

export interface ChallengeSkeleton {
  type: CHALLENGE_TYPE;
  id: string;
  title: string;
  videoUrl?: string;
}
