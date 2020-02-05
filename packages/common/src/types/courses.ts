/** ===========================================================================
 * Product Curriculum Hierarchy:
 *
 * PRODUCT
 * - Course List (many courses: {id, title, modules})
 *   - Module List (many modules: {id, title, challenges})
 *     - Challenge List (many challenges: {challengeData})
 * ============================================================================
 */

export type CourseList = Course[];

export type CHALLENGE_TYPE =
  | "react"
  | "typescript"
  | "markup"
  | "media"
  | "section"
  | "project"
  | "guided-project"
  | "special-topic";

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

export type ModuleList = Module[];

export interface Challenges {
  id: string;
  type: string;
  title: string;
}

export type ChallengeList = Challenge[];

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

/** ===========================================================================
 * Course Skeleton
 * ----------------------------------------------------------------------------
 * This is a modified version of the course content which strips out the actual
 * challenge content. This is used to display the navigation map of all the
 * challenges for a course.
 * ============================================================================
 */

export type CourseSkeletonList = CourseSkeleton[];

export interface CourseSkeleton {
  id: string;
  title: string;
  description: string;
  modules: ModuleSkeletonList;
}

export type ModuleSkeletonList = ModuleSkeleton[];

export interface ModuleSkeleton {
  id: string;
  title: string;
  userCanAccess: boolean;
  challenges: ChallengeSkeletonList;
}

export type ChallengeSkeletonList = ChallengeSkeleton[];

export interface ChallengeSkeleton {
  type: CHALLENGE_TYPE;
  id: string;
  title: string;
  videoUrl?: string;
  userCanAccess: boolean;
}
