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

class ContentUtilityClass {
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
            free: courseModule.free,
            userCanAccess: courseModule.free,
            challenges: courseModule.challenges.map(challenge => {
              // NOTE: The reason for reassigning values specifically like
              // this is to exclude the other challenge information (e.g.
              // code, solution, tests, etc.) from the challenge data in
              // the course skeleton. This is because all users can view
              // the skeleton, but not all course content, so the skeleton
              // must be stripped off the additional content.
              return {
                id: challenge.id,
                type: challenge.type,
                title: challenge.title,
                videoUrl: challenge.videoUrl,
                userCanAccess: courseModule.free,
                free: challenge.free,
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
      // Transform the course to only include free modules and free
      // challenges.
      const courseWithFreeContent = {
        ...course,
        modules: course.modules.map(m => {
          if (m.free) {
            return m;
          } else {
            return {
              ...m,
              challenges: m.challenges.filter(c => c.free),
            };
          }
        }),
      };

      return courseWithFreeContent;
    } else {
      // Return the entire course because the user has paid.
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
            // Some modules are free.
            const moduleFree = courseModule.free;
            const userCanAccessModule = canAccessCourse || moduleFree;

            return {
              ...courseModule,
              userCanAccess: userCanAccessModule,
              challenges: courseModule.challenges.map(challenge => {
                // Some challenges are free.
                const challengeFree = challenge.free;
                const userCanAccessChallenge =
                  userCanAccessModule || challengeFree;

                return {
                  ...challenge,
                  userCanAccess: userCanAccessChallenge,
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

  deriveChallengeContextFromId = (challengeId: string) => {
    if (!this.challengeIdIsValid(challengeId)) {
      return null;
    }

    const courseId = Array.from(this.courseIdSet.values()).find(id =>
      this.challengeIdInCourseIsValid(id, challengeId),
    );

    const course = this.courses.find(({ id }) => id === courseId);

    for (const module of course.modules) {
      for (const challenge of module.challenges) {
        if (challenge.id === challengeId) {
          return {
            challenge,
            module: {
              title: module.title,
              id: module.id,
              free: module.free,
            },
            course: {
              title: course.title,
              id: course.id,
            },
          };
        }
      }
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

const ContentUtility = new ContentUtilityClass(courseList as CourseList);

export { ContentUtilityClass };

export default ContentUtility;
