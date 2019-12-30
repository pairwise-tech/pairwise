import FullstackTypeScript from "../courses/01_programming_fundamental.json";
import { CourseList } from "src/types/courses";

/** ===========================================================================
 * Challenge Utility Class
 * ----------------------------------------------------------------------------
 * A class with various helper utilities for dealing with the curriculum
 * courses, modules, and challenges.
 * ============================================================================
 */

class ChallengeUtilityClass {
  courses: CourseList;
  courseIdSet: Set<string>;

  constructor(courses: CourseList) {
    this.courses = courses;

    this.initializeCourseIdSet(courses);
  }

  initializeCourseIdSet = (courses: CourseList) => {
    const idSet: Set<string> = new Set();
    for (const course of courses) {
      idSet.add(course.id);
    }
    this.courseIdSet = idSet;
  };

  courseIdIsValid = (courseId: string) => {
    return this.courseIdSet.has(courseId);
  };
}

/** ===========================================================================
 * Export
 * ============================================================================
 */

const courseList = [FullstackTypeScript];

const challengeUtilityClass = new ChallengeUtilityClass(
  courseList as CourseList,
);

export default challengeUtilityClass;
