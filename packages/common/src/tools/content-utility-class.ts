import FullstackTypeScript from "../courses/01_programming_fundamental.json";
import {
  CourseList,
  CourseSkeletonList,
  CourseMetadata,
} from "src/types/courses";
import { COURSE_ACCESS_LEVEL, UserCourseAccessMap } from "src/types/dto.js";

/** ===========================================================================
 * Challenge Utility Class
 * ----------------------------------------------------------------------------
 * A class with various helper utilities for dealing with the curriculum
 * courses, modules, and challenges. This is primarily used in the server
 * application.
 *
 * TODO: It could be useful to add some tests for this class.
 * ============================================================================
 */

export class ContentUtilityClass {
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
            id: courseModule.id,
            title: courseModule.title,
            userCanAccess: courseModule.free,
            challenges: courseModule.challenges.map(challenge => {
              return {
                id: challenge.id,
                type: challenge.type,
                title: challenge.title,
                videoUrl: challenge.videoUrl,
                userCanAccess: courseModule.free,
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

  getCourseNavigationSkeletons = (
    courseAccessMap: UserCourseAccessMap = {},
  ) => {
    const skeletonsWithAccessInformation = this.courseNavigationSkeletons.map(
      course => {
        // The user can access all the content in the course if the course
        // id is included in the provided course access map (which represents
        // the courses the user has purchased).
        const canAccessCourse = course.id in courseAccessMap;
        return {
          ...course,
          modules: course.modules.map(courseModule => {
            return {
              ...courseModule,
              userCanAccess: canAccessCourse,
              challenges: courseModule.challenges.map(challenge => {
                return {
                  ...challenge,
                  userCanAccess: canAccessCourse,
                };
              }),
            };
          }),
        };
      },
    );

    return skeletonsWithAccessInformation;
  };

  getCourseMetadata = (courseId: string): CourseMetadata => {
    const course = this.courses.find(c => c.id === courseId);
    if (course) {
      return {
        id: course.id,
        title: course.title,
        description: course.description,
      };
    } else {
      return null;
    }
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

/**
 * Modify in the future if more courses are added.
 */
const courseList = [FullstackTypeScript];

const contentUtility = new ContentUtilityClass(courseList as CourseList);

export default contentUtility;
