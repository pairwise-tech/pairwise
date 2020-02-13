import { Injectable, BadRequestException } from "@nestjs/common";

import { contentUtility } from "@pairwise/common";
import { RequestUser } from "src/types";
import { ERROR_CODES } from "src/tools/constants";

@Injectable()
export class ContentService {
  fetchCourseSkeletons(user: RequestUser) {
    if (user) {
      const { courses } = user;
      return contentUtility.getCourseNavigationSkeletons(courses);
    } else {
      return contentUtility.getCourseNavigationSkeletons();
    }
  }

  fetchCourses(user: RequestUser, courseId: string) {
    if (!user) {
      return this.fetchFreeCourseContent(courseId);
    }

    const { courses } = user;

    if (!contentUtility.courseIdIsValid(courseId)) {
      throw new BadRequestException(ERROR_CODES.INVALID_COURSE_ID);
    }

    if (courseId in courses) {
      return contentUtility.getCourseContent(courseId, "PAID");
    } else {
      return this.fetchFreeCourseContent(courseId);
    }
  }

  private fetchFreeCourseContent(courseId: string) {
    return contentUtility.getCourseContent(courseId, "FREE");
  }
}
