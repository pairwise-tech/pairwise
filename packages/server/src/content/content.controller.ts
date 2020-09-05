import { Controller, Get, Req, UseGuards, Param } from "@nestjs/common";
import { ContentService } from "./content.service";
import { AuthenticatedRequest } from "../types";
import { CustomJwtAuthGuard } from "../auth/jwt.guard";

@Controller("content")
export class ContentController {
  constructor(private readonly challengeService: ContentService) {}

  @UseGuards(CustomJwtAuthGuard)
  @Get("/skeletons")
  public fetchCourseSkeletons(
    @Param() params,
    @Req() req: AuthenticatedRequest,
  ) {
    const { user } = req;
    return this.challengeService.fetchCourseSkeletons(user);
  }

  @UseGuards(CustomJwtAuthGuard)
  @Get("/courses")
  public fetchCourseContent(@Param() params, @Req() req: AuthenticatedRequest) {
    return this.challengeService.fetchCourses(req.user);
  }
}
