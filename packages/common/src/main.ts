import FullstackTypeScript from "./courses/01_programming_fundamental.json";
import challengeUtilityClass from "./tools/challenge-utility-class";

/**
 * Type Definitions
 */
export * from "./types/courses";
export * from "./types/result";
export * from "./types/dto";

/**
 * Shared Utils
 */
export * from "./tools/utils";

/**
 * Courses
 */
const Courses = {
  FullstackTypeScript,
};

export { challengeUtilityClass };

export default Courses;
