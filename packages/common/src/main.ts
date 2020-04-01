import PairwiseContent from "./courses/00_pairwise_content.json";
import FullstackTypeScript from "./courses/01_fullstack_typescript.json";

import ContentUtility, {
  ContentUtilityClass,
} from "./tools/content-utility-class";

/**
 * Types
 */
export * from "./types/courses";
export * from "./types/result";
export * from "./types/dto";

/**
 * Utils
 */
export * from "./tools/utils";

/**
 * Content Utility
 */
export { ContentUtility, ContentUtilityClass };

/**
 * Courses
 */
const Courses = {
  FullstackTypeScript,
  PairwiseContent,
};

export default Courses;
