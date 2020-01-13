import { Controller, Get, Req, UseGuards, Param } from "@nestjs/common";
import { ContentService } from "./content.service";
import { AuthenticatedRequest } from "src/types";
import { CustomJwtAuthGuard } from "src/auth/jwt.guard";

@Controller("content")
export class ContentController {
  constructor(private readonly challengeService: ContentService) {}

  @UseGuards(CustomJwtAuthGuard)
  @Get("/skeletons")
  fetchCourseSkeletons(@Param() params, @Req() req: AuthenticatedRequest) {
    const { user } = req;
    return this.challengeService.fetchCourseSkeletons(user);
  }

  @UseGuards(CustomJwtAuthGuard)
  @Get("/course/:id")
  fetchCourseContent(@Param() params, @Req() req: AuthenticatedRequest) {
    const { id } = params;
    const { user } = req;

    if (user) {
      return this.challengeService.fetchCoursesAuthenticated(user, id);
    }

    return this.challengeService.fetchFreeCourseContent(id);
  }
}
