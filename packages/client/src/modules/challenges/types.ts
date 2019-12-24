/** ===========================================================================
 * Product Curriculum Hierarchy:
 *
 * PRODUCT
 * - Course List (many courses: {id, title, modules})
 *   - Module List (many modules: {id, title, challenges})
 *     - Challenge List (many challenges: {challengeData})
 * ============================================================================
 */

export type CourseList = readonly Course[];

export interface Course {
  id: string;
  title: string;
  modules: ModuleList;
}

export interface Module {
  id: string;
  title: string;
  challenges: ChallengeList;
}

export type ModuleList = readonly Module[];

export interface Challenges {
  id: string;
  type: string;
  title: string;
}

export type ChallengeList = readonly Challenge[];

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

export interface InverseChallengeMapping {
  [k: string]: {
    courseId: string;
    moduleId: string;
  };
}

export type CHALLENGE_TYPE = "react" | "typescript" | "markup";
