import { Challenge, Module } from "@prototype/common";

/** ===========================================================================
 * Product Curriculum Hierarchy:
 *
 * PRODUCT
 * - Course List (many courses: {id, title, modules})
 *   - Module List (many modules: {id, title, challenges})
 *     - Challenge List (many challenges: {challengeData})
 * ============================================================================
 */

export interface InverseChallengeMapping {
  [k: string]: {
    courseId: string;
    moduleId: string;
  };
}

export interface ChallengeCreationPayload {
  insertionIndex: number; // Index at which to insert this new challenge
  courseId: string;
  moduleId: string;
  challenge: Challenge;
}

export interface ModuleCreationPayload {
  insertionIndex: number; // Index at which to insert this new challenge
  courseId: string;
  module: Module;
}

export interface ModuleUpdatePayload {
  id: string; // Module id
  courseId: string;
  module: Partial<Module>;
}

export interface ChallengeUpdatePayload {
  id: string; // Challenge ID
  challenge: Partial<Challenge>;
}
