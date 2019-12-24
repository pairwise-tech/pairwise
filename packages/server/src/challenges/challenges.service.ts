import { Injectable } from "@nestjs/common";

import Courses from "@prototype/common";

@Injectable()
export class ChallengesService {
  fetchCourses() {
    return Courses.FullstackTypeScript;
  }
}
