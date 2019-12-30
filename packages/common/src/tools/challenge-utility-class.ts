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
  private courses: CourseList;
  private courseIdSet: Set<string>;
  private courseIdChallengeIdMap: Map<string, Set<string>>;

  constructor(courses: CourseList) {
    this.courses = courses;

    this.initializeCourseIdSet(courses);
    this.initializeCourseIdChallengeIdMap(courses);
  }

  initializeCourseIdSet = (courses: CourseList) => {
    const idSet: Set<string> = new Set();
    for (const course of courses) {
      idSet.add(course.id);
    }
    this.courseIdSet = idSet;
  };

  initializeCourseIdChallengeIdMap = (courses: CourseList) => {
    const courseIdChallengeIdMap = new Map();

    for (const course of courses) {
      const courseId = course.id;
      const courseResult = new Set();
      for (const module of course.modules) {
        for (const challenge of module.challenges) {
          const { id } = challenge;
          courseResult.add(id);
        }
      }

      courseIdChallengeIdMap.set(courseId, courseResult);
    }

    this.courseIdChallengeIdMap = courseIdChallengeIdMap;
  };

  courseIdIsValid = (courseId: string) => {
    return this.courseIdSet.has(courseId);
  };

  challengeIdInCourseIsValid = (courseId: string, challengeId: string) => {
    const courseChallengeIdSet = this.courseIdChallengeIdMap.get(courseId);
    if (courseChallengeIdSet) {
      return courseChallengeIdSet.has(challengeId);
    }

    return false;
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
