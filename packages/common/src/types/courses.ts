/** ===========================================================================
 * Product Curriculum Hierarchy:
 *
 * PRODUCT
 * - Course List (many courses: {id, title, modules})
 *   - Module List (many modules: {id, title, challenges})
 *     - Challenge List (many challenges: {challengeData})
 * ============================================================================
 */

export interface CourseBase {
  id: string;
  title: string;
  description: string;
  free: boolean;
  price: number; // Course price, in cents (e.g. 5000 = $50)
}

export type CourseMetadata = CourseBase;

export interface ChallengeMetadata {
  filename: string;
  keypath: Array<string | number>;
  course: {
    id: string;
    title: string;
    description: string;
    free: boolean;
    price: number;
  };
  module: {
    id: string;
    title: string;
    free: boolean;
  };
  challenge: {
    id: string;
    type: string;
    title: string;
  };
  gitMetadata: {
    lineRange: number[];
    contributors: string[];
    contributionsBy: { [k: string]: string[] };
    edits: number;
    earliestUpdate: {
      commit: string;
      summary: string;
      author: string;
      authorDate: string;
    };
    latestUpdate: {
      commit: string;
      summary: string;
      author: string;
      authorDate: string;
    };
  };
}

interface PairwiseStats {
  buildCommit: string;
  totalChallenges: number;
  codeChallenges: number;
  videoChallenges: number;
  todoChallenges: string[];
}

export interface ChallengeMetadataIndex {
  "@@PAIRWISE": PairwiseStats;
  challenges: { [k: string]: ChallengeMetadata };
}

export type CourseList = Course[];

export type CHALLENGE_TYPE =
  // Primary Course (TypeScript)
  | "react"
  | "typescript"
  | "markup"
  | "media"
  | "section"
  | "project"
  | "guided-project"
  | "special-topic"
  // Rust
  | "rust";

export type CHALLENGE_PROGRESS = "NOT_ATTEMPTED" | "INCOMPLETE" | "COMPLETE";

export interface Course extends CourseBase {
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
  instructions: string;
  testCode: string;
  videoUrl?: string;
  starterCode: string;
  solutionCode: string;
  content: string;
  free?: boolean;
  isPaidContent?: boolean;
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

export interface CourseSkeleton extends CourseBase {
  modules: ModuleSkeletonList;
}

export type ModuleSkeletonList = ModuleSkeleton[];

export interface ModuleSkeleton {
  id: string;
  title: string;
  free: boolean;
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
  free?: boolean;
}
