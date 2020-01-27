import { Injectable, BadRequestException } from "@nestjs/common";

import { challengeUtilityClass } from "@pairwise/common";
import { RequestUser } from "src/types";
import { ERROR_CODES } from "src/tools/constants";

@Injectable()
export class ContentService {
  fetchCourseSkeletons(user: RequestUser) {
    if (user) {
      const { courses } = user;
      return challengeUtilityClass.getCourseNavigationSkeletons(courses);
    } else {
      return challengeUtilityClass.getCourseNavigationSkeletons();
    }
  }

  fetchCourses(user: RequestUser, courseId: string) {
    if (!user) {
      return this.fetchFreeCourseContent(courseId);
    }

    const { courses } = user;

    if (!challengeUtilityClass.courseIdIsValid(courseId)) {
      throw new BadRequestException(ERROR_CODES.INVALID_COURSE_ID);
    }

    if (courseId in courses) {
      return challengeUtilityClass.getCourseContent(courseId, "PAID");
    } else {
      return this.fetchFreeCourseContent(courseId);
    }
  }

  private fetchFreeCourseContent(courseId: string) {
    return challengeUtilityClass.getCourseContent(courseId, "FREE");
  }
}
