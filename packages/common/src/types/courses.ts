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
  premiumPrice: number;
}

export type CourseMetadata = CourseBase;

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
  // Other Languages
  | "rust"
  | "python"
  | "golang";

export type CHALLENGE_PROGRESS = "NOT_ATTEMPTED" | "INCOMPLETE" | "COMPLETE";

export interface Course extends CourseBase {
  modules: ModuleList;
}

export interface Module {
  id: string;
  title: string;
  free: boolean;
  skillTags?: PortfolioSkills[];
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
  skillTags?: PortfolioSkills[];
}

/** ===========================================================================
 * Skills
 * ============================================================================
 */

export enum PortfolioSkills {
  HTML = "HTML",
  CSS = "CSS",
  TypeScript = "TypeScript",
  Git = "Git",
  GitHub = "GitHub",
  React = "React",
  NodeJS = "NodeJS",
  Express = "Express",
  PostgreSQL = "PostgreSQL",
  Jest = "Jest",
  Docker = "Docker",
}

const skills: PortfolioSkills[] = [];

for (let x in PortfolioSkills) {
  const key = x as PortfolioSkills;
  const skill: PortfolioSkills = PortfolioSkills[key];
  skills.push(skill);
}

export const portfolioSkillsList = skills;

export interface PortfolioSkillSummary {
  total: number;
  accomplished: number;
}

type SkillKey = keyof typeof PortfolioSkills;
type PortfolioSkillSummaryMap = { [key in SkillKey]: PortfolioSkillSummary };

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

/** ===========================================================================
 * Challenge Meta Database Entity
 * ============================================================================
 */

export interface ChallengeMeta {
  challengeId: string;
  numberOfTimesAttempted: number;
  numberOfTimesCompleted: number;
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
  skillTags?: PortfolioSkills[];
  challenges: ChallengeSkeletonList;
}

export type ChallengeSkeletonList = ChallengeSkeleton[];

export interface ChallengeSkeleton {
  type: CHALLENGE_TYPE;
  id: string;
  title: string;
  videoUrl?: string;
  userCanAccess: boolean;
  skillTags?: PortfolioSkills[];
  free?: boolean;
}
