import { Injectable } from "@nestjs/common";

import FullstackTypeScriptCourseJSON from "../../../courses/01_programming_fundamental.json";

@Injectable()
export class ChallengesService {
  fetchCourses() {
    return FullstackTypeScriptCourseJSON;
  }
}
