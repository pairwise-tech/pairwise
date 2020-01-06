import { Injectable } from "@nestjs/common";

import Courses from "@pairwise/common";
import { RequestUser } from "src/types";

@Injectable()
export class ChallengesService {
  fetchFreeCourseContent() {
    return Courses.FullstackTypeScript;
  }

  fetchCoursesAuthenticated(user: RequestUser) {
    /**
     * TODO: A real user exists and if they have paid for the course content
     * they should see all the course content.
     */
    const paid = false;

    if (paid) {
      /* TODO: Implement this */
      return Courses.FullstackTypeScript;
    } else {
      return this.fetchFreeCourseContent();
    }
  }
}
