import lunr from "lunr";
import { Challenge, Module, Course } from "@pairwise/common";
import { BUILD_SEARCH_INDEX, SEARCH, SEARCH_SUCCESS } from "tools/constants";

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

/**
 * User configurable editor options for monaco
 */
export interface MonacoEditorOptions {
  fontSize: number;
}

export interface ModuleUpdatePayload {
  id: string; // Module id
  courseId: string;
  module: Partial<Module>;
}

export interface ModuleDeletePayload {
  id: string; // Module id
  courseId: string;
}

export interface ChallengeUpdatePayload {
  id: string; // Challenge ID
  challenge: Partial<Challenge>;
}

export interface ChallengeDeletePayload {
  courseId: string;
  moduleId: string;
  challengeId: string;
}

export interface ChallengeReorderPayload {
  courseId: string;
  moduleId: string;
  challengeOldIndex: number;
  challengeNewIndex: number;
}

export interface ModuleReorderPayload {
  courseId: string;
  moduleOldIndex: number;
  moduleNewIndex: number;
}

export interface SearchAction {
  type: typeof SEARCH;
  payload: string;
}

export interface BuildSearchIndexAction {
  type: typeof BUILD_SEARCH_INDEX;
  payload: Course;
}

export interface SearchDocument {
  id: string;
  title: string;
  content: string;
  supplementaryContent: string;
}

export interface SearchMessageEvent extends MessageEvent {
  data: BuildSearchIndexAction | SearchAction;
}

export interface SearchResult extends lunr.Index.Result {}

export interface SearchResultEvent extends MessageEvent {
  data: {
    type: typeof SEARCH_SUCCESS;
    payload: SearchResult[];
  };
}
