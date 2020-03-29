import FullstackTypeScript from "./courses/fullstack_typescript.json";
import PairwiseContent from "./courses/pairwise_content.json";

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
