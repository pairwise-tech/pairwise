import FullstackTypeScript from "../courses/01_programming_fundamental.json";
import { CourseList, CourseSkeletonList } from "src/types/courses";
import { COURSE_ACCESS_LEVEL } from "src/types/dto.js";

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
  private challengeIdSet: Set<string>;
  private courseIdChallengeIdMap: Map<string, Set<string>>;
  private courseNavigationSkeletons: CourseSkeletonList;

  constructor(courses: CourseList) {
    this.courses = courses;

    this.initializeCourseIdSet(courses);
    this.initializeCourseIdChallengeIdMap(courses);
    this.initializeCourseNavigationSkeletons(courses);
  }

  private initializeCourseIdSet = (courses: CourseList) => {
    const idSet: Set<string> = new Set();
    for (const course of courses) {
      idSet.add(course.id);
    }
    this.courseIdSet = idSet;
  };

  private initializeCourseIdChallengeIdMap = (courses: CourseList) => {
    const courseIdChallengeIdMap = new Map();
    const challengeIdSet: Set<string> = new Set();

    for (const course of courses) {
      const courseId = course.id;
      const courseResult = new Set();
      for (const module of course.modules) {
        for (const challenge of module.challenges) {
          const { id } = challenge;
          courseResult.add(id);
          challengeIdSet.add(id);
        }
      }

      courseIdChallengeIdMap.set(courseId, courseResult);
    }

    this.challengeIdSet = challengeIdSet;
    this.courseIdChallengeIdMap = courseIdChallengeIdMap;
  };

  private initializeCourseNavigationSkeletons = (courses: CourseList) => {
    /**
     * Modify all the courses, stripping out the actual challenge content. This
     * is necessary to still provide an overview of all the course data to the
     * client.
     */
    this.courseNavigationSkeletons = courses.map(course => {
      return {
        ...course,
        modules: course.modules.map(courseModule => {
          return {
            ...courseModule,
            challenges: courseModule.challenges.map(challenge => {
              return {
                id: challenge.id,
                type: challenge.type,
                title: challenge.title,
                videoUrl: challenge.videoUrl,
              };
            }),
          };
        }),
      };
    });
  };

  getCourseContent = (courseId: string, accessLevel: COURSE_ACCESS_LEVEL) => {
    const course = this.courses.find(c => c.id === courseId);

    if (accessLevel === "FREE") {
      const freeContent = {
        ...course,
        modules: course.modules.filter(m => m.free),
      };

      return freeContent;
    } else {
      return course;
    }
  };

  getCourseNavigationSkeletons = () => {
    return this.courseNavigationSkeletons;
  };

  courseIdIsValid = (courseId: string) => {
    return this.courseIdSet.has(courseId);
  };

  challengeIdIsValid = (challengeId: string) => {
    return this.challengeIdSet.has(challengeId);
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
