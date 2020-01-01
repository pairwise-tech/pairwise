import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { ChallengesService } from "./challenges.service";
import { AuthenticatedRequest } from "src/types";
import { CustomJwtAuthGuard } from "src/auth/jwt.guard";

@Controller("challenges")
export class ChallengesController {
  constructor(private readonly challengeService: ChallengesService) {}

  @UseGuards(CustomJwtAuthGuard)
  @Get()
  fetchChallenges(@Req() req: AuthenticatedRequest) {
    const { user } = req;
    const authenticated = user !== undefined;

    if (authenticated) {
      return this.challengeService.fetchCoursesAuthenticated(user);
    }

    return this.challengeService.fetchFreeCourseContent();
  }
}
