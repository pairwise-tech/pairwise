// import PairwiseLibrary from "./courses/00_pairwise_library.json";
import FullstackTypeScript from "./courses/01_fullstack_typescript.json";
import Python from "./courses/02_python_language.json";
import Rust from "./courses/03_rust_language.json";
import Golang from "./courses/04_golang_language.json";

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
  // PairwiseLibrary,
  FullstackTypeScript,
  Python,
  Rust,
  Golang,
};

export default Courses;
