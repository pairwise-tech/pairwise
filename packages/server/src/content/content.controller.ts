import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { ContentService } from "./content.service";
import { AuthenticatedRequest } from "../types";
import { CustomJwtAuthGuard } from "../auth/jwt.guard";

@Controller("content")
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @UseGuards(CustomJwtAuthGuard)
  @Get("/skeletons")
  public fetchCourseSkeletons(@Req() req: AuthenticatedRequest) {
    const { user } = req;
    return this.contentService.fetchCourseSkeletons(user);
  }

  @UseGuards(CustomJwtAuthGuard)
  @Get("/courses")
  public fetchCourseContent(@Req() req: AuthenticatedRequest) {
    return this.contentService.fetchCourses(req.user);
  }
}
