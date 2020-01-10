import { Controller, Get, Req, UseGuards, Param } from "@nestjs/common";
import { ContentService } from "./content.service";
import { AuthenticatedRequest } from "src/types";
import { CustomJwtAuthGuard } from "src/auth/jwt.guard";

@Controller("content")
export class ContentController {
  constructor(private readonly challengeService: ContentService) {}

  @Get("/skeletons")
  fetchChallengeSkeletons() {
    return this.challengeService.fetchCourseSkeletons();
  }

  @UseGuards(CustomJwtAuthGuard)
  @Get("/course/:id")
  fetchCourseContent(@Param() params, @Req() req: AuthenticatedRequest) {
    const { id } = params;
    const { user } = req;
    const authenticated = user !== undefined;

    if (authenticated) {
      return this.challengeService.fetchCoursesAuthenticated(user, id);
    }

    return this.challengeService.fetchFreeCourseContent(id);
  }
}
