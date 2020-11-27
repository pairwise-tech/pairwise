import {
  Controller,
  Post,
  Body,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Get,
  Req,
  Param,
} from "@nestjs/common";
import { ProgressDto } from "./progress.dto";
import { ProgressService } from "./progress.service";
import { AuthGuard } from "@nestjs/passport";
import { AuthenticatedRequest } from "../types";
import { UserCourseProgress } from "@pairwise/common";
import { SUCCESS_CODES } from "../tools/constants";

@Controller("progress")
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @UseGuards(AuthGuard("jwt"))
  @Get()
  public fetchUserChallengeProgress(@Req() req: AuthenticatedRequest) {
    return this.progressService.fetchUserProgress(req.user.profile.uuid);
  }

  @Get("/records")
  public retrieveLiveProgressRecords() {
    return this.progressService.retrieveProgressRecords();
  }

  @Post("/anonymous/:uuid")
  @UsePipes(ValidationPipe)
  public updateUserChallengeProgressAnonymous(
    @Param() params,
    @Body() challengeProgressDto: ProgressDto,
  ) {
    return this.progressService.updateUserProgressHistoryAnonymous(
      params.uuid,
      challengeProgressDto,
    );
  }

  @UseGuards(AuthGuard("jwt"))
  @Post()
  @UsePipes(ValidationPipe)
  public updateUserChallengeProgress(
    @Body() challengeProgressDto: ProgressDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.progressService.updateUserProgressHistory(
      req.user,
      challengeProgressDto,
    );
  }

  @UseGuards(AuthGuard("jwt"))
  @Post("/bulk")
  @UsePipes(ValidationPipe)
  public async updateUserChallengeProgressBulk(
    @Body() userCourseProgress: UserCourseProgress,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.progressService.persistUserCourseProgress(
      userCourseProgress,
      req.user,
    );

    return SUCCESS_CODES.OK;
  }
}
