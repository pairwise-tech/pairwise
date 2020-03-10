import { Injectable, BadRequestException } from "@nestjs/common";

import { ContentUtility } from "@pairwise/common";
import { RequestUser } from "src/types";
import { ERROR_CODES } from "src/tools/constants";

@Injectable()
export class ContentService {
  public fetchCourseSkeletons(user: RequestUser) {
    if (user) {
      const { courses } = user;
      return ContentUtility.getCourseNavigationSkeletons(courses);
    } else {
      return ContentUtility.getCourseNavigationSkeletons();
    }
  }

  public fetchCourses(user: RequestUser, courseId: string) {
    if (!user) {
      return this.fetchFreeCourseContent(courseId);
    }

    const { courses } = user;

    if (!ContentUtility.courseIdIsValid(courseId)) {
      throw new BadRequestException(ERROR_CODES.INVALID_COURSE_ID);
    }

    if (courseId in courses) {
      return ContentUtility.getCourseContent(courseId, "PAID");
    } else {
      return this.fetchFreeCourseContent(courseId);
    }
  }

  private fetchFreeCourseContent(courseId: string) {
    return ContentUtility.getCourseContent(courseId, "FREE");
  }
}
