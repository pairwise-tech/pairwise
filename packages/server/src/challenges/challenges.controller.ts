import { Controller, Get } from "@nestjs/common";

import { ChallengesService } from "./challenges.service";

@Controller("challenges")
export class ChallengesController {
  constructor(private readonly challengeService: ChallengesService) {}

  @Get()
  fetchChallenges() {
    return this.challengeService.fetchCourses();
  }
}
