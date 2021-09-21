// Library course is hidden for now.
// import PairwiseLibrary from "../courses/00_pairwise_library.json";
import FullstackTypeScript from "../courses/01_fullstack_typescript.json";
import Python from "../courses/02_python_language.json";
import Rust from "../courses/03_rust_language.json";
import Golang from "../courses/04_golang_language.json";

import {
  CourseGenericList,
  CourseList,
  CourseSkeletonList,
  CourseMetadata,
  Course,
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
    this.courseNavigationSkeletons = this.convertCourseListToSkeletons(courses);
  };

  convertCourseListToSkeletons = (courses: CourseList) => {
    /**
     * Modify all the courses, stripping out the actual challenge content. This
     * is necessary to still provide an overview of all the course data to the
     * client.
     */
    const result = courses.map((course) => {
      return {
        ...course,
        modules: course.modules.map((courseModule) => {
          return {
            id: courseModule.id,
            title: courseModule.title,
            free: courseModule.free,
            userCanAccess: courseModule.free,
            skillTags: courseModule.skillTags,
            challenges: courseModule.challenges.map((challenge) => {
              // NOTE: The reason for reassigning values specifically like
              // this is to exclude the other challenge information (e.g.
              // code, solution, tests, etc.) from the challenge data in
              // the course skeleton. This is because all users can view
              // the skeleton, but not all course content, so the skeleton
              // must be stripped of the additional content.
              return {
                id: challenge.id,
                free: challenge.free,
                type: challenge.type,
                title: challenge.title,
                videoUrl: challenge.videoUrl,
                skillTags: challenge.skillTags,
                userCanAccess: courseModule.free,
              };
            }),
          };
        }),
      };
    });

    return this.mapCourseSkillTags<CourseSkeletonList>(result);
  };

  getCourses = (userCourseAccessMap: UserCourseAccessMap): CourseList => {
    return this.courses.map((course) => {
      const accessLevel: COURSE_ACCESS_LEVEL =
        course.id in userCourseAccessMap ? "PAID" : "FREE";

      return this.getCourseContent(course.id, accessLevel);
    });
  };

  getCourseContent = (courseId: string, accessLevel: COURSE_ACCESS_LEVEL) => {
    const course = this.courses.find((c) => c.id === courseId);

    let result: Course;

    if (accessLevel === "FREE") {
      // Transform the course to only include free modules and free
      // challenges.
      const courseWithFreeContent = {
        ...course,
        modules: course.modules.map((m) => {
          // Re-enable to revert logic back to restricting free content:
          if (course.free || m.free) {
            return m;
          } else {
            return {
              ...m,
              challenges: m.challenges.filter((c) => c.free),
            };
          }
        }),
      };

      result = courseWithFreeContent;
    } else {
      // Return the entire course because the user has paid.
      result = course;
    }

    return this.mapCourseSkillTags<CourseList>([result])[0];
  };

  getCourseNavigationSkeletons = (
    courseAccessMap: UserCourseAccessMap = {},
  ): CourseSkeletonList => {
    const skeletonsWithAccessInformation: CourseSkeletonList =
      this.courseNavigationSkeletons.map((course) => {
        // The user can access all the content in the course if the course
        // id is included in the provided course access map (which represents
        // the courses the user has purchased) or if the entire course is
        // marked as free (e.g. the Pairwise Library course).
        // NOTE: All content is currently provided. Revert the "canAccess"
        // flags below to start restricting access again.
        const isCourseFree = course.free;
        const canAccessCourse = course.id in courseAccessMap || isCourseFree;

        return {
          ...course,
          modules: course.modules.map((courseModule) => {
            // The user can access the module if they can access the course
            // or if the module is marked as free.
            const isModuleFree = courseModule.free;
            const canAccessModule = canAccessCourse || isModuleFree;

            return {
              ...courseModule,
              userCanAccess: canAccessModule,

              challenges: courseModule.challenges.map((challenge) => {
                // The user can access the challenge if they can access the
                // course or if the challenge is marked as free.
                const isChallengeFree = challenge.free;
                const canAccessChallenge = canAccessModule || isChallengeFree;

                return {
                  ...challenge,
                  userCanAccess: canAccessChallenge,
                };
              }),
            };
          }),
        };
      });

    return this.mapCourseSkillTags<CourseSkeletonList>(
      skeletonsWithAccessInformation,
    );
  };

  getCourseMetadata = (courseId: string): CourseMetadata => {
    const course = this.courses.find((c) => c.id === courseId);
    if (course) {
      return {
        id: course.id,
        title: course.title,
        free: course.free,
        price: course.price,
        premiumPrice: course.premiumPrice,
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

    const courseId = Array.from(this.courseIdSet.values()).find((id) =>
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

  getCourseIds = () => {
    return this.courses.map((c) => c.id);
  };

  /**
   * Map the course lists to reset the userCanAccess permissions for the
   * admin user.
   */
  mapCoursesToAdmin = (courseList: CourseGenericList): CourseGenericList => {
    return courseList.map((c) => {
      return {
        ...c,
        userCanAccess: true,
        modules: c.modules.map((m) => {
          return {
            ...m,
            userCanAccess: true,
            challenges: m.challenges.map((c) => {
              return {
                ...c,
                userCanAccess: true,
              };
            }),
          };
        }),
      };
    });
  };

  /**
   * "Inherit" skill tags information down the course hierarchy, i.e. if
   * a module has specific skillTags map those to all individual challenges
   * in that module.
   */
  mapCourseSkillTags = <List extends CourseGenericList>(
    courseList: List,
  ): List => {
    const result = courseList.map((c) => {
      return {
        ...c,
        modules: c.modules.map((m) => {
          const moduleSkillTags = m.skillTags || [];
          return {
            ...m,
            challenges: m.challenges.map((c) => {
              const challengeSkillTags = c.skillTags || [];
              const combinedSkillTags = new Set(
                moduleSkillTags.concat(challengeSkillTags),
              );

              return {
                ...c,
                skillTags: Array.from(combinedSkillTags),
              };
            }),
          };
        }),
      };
    });

    return result as List;
  };
}

/** ===========================================================================
 * Export
 * ============================================================================
 */

// Add any additional courses to this list:
// const courseList = [FullstackTypeScript, Python, Rust, Golang];

// Only TS course for now:
const courseList = [FullstackTypeScript];

const ContentUtility = new ContentUtilityClass(courseList as CourseList);

export { ContentUtilityClass };

export default ContentUtility;
