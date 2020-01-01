import { Controller, Get, Req } from "@nestjs/common";
import { ChallengesService } from "./challenges.service";
import { AuthenticatedRequest } from "src/types";

@Controller("challenges")
export class ChallengesController {
  constructor(private readonly challengeService: ChallengesService) {}

  @Get()
  fetchChallenges(@Req() req: AuthenticatedRequest) {
    return this.challengeService.fetchCourses();
  }
}
