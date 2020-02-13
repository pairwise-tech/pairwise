import FullstackTypeScript from "./courses/01_programming_fundamental.json";
import contentUtility from "./tools/content-utility-class";

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
export { contentUtility };

/**
 * Courses
 */
const Courses = {
  FullstackTypeScript,
};

export default Courses;
