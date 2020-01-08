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
import { UserCourseProgressDto } from "./userCourseProgress.dto";
import { ProgressService } from "./progress.service";
import { UserCodeBlobDto } from "./userCodeBlob.dto";
import { AuthGuard } from "@nestjs/passport";
import { AuthenticatedRequest } from "src/types";

@Controller("progress")
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @UseGuards(AuthGuard("jwt"))
  @Get()
  fetchUserChallengeProgress(@Req() req: AuthenticatedRequest) {
    return this.progressService.fetchUserProgress(req.user);
  }

  @UseGuards(AuthGuard("jwt"))
  @Post()
  @UsePipes(ValidationPipe)
  updateUserChallengeProgress(
    @Body() challengeProgressDto: UserCourseProgressDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.progressService.updateUserProgressHistory(
      req.user,
      challengeProgressDto,
    );
  }

  @UseGuards(AuthGuard("jwt"))
  @Get("/challenge/:id")
  fetchUserChallengeHistory(@Param() params, @Req() req: AuthenticatedRequest) {
    const { id } = params;
    return this.progressService.fetchUserCodeBlob(req.user, id);
  }

  @UseGuards(AuthGuard("jwt"))
  @Post("/challenge")
  @UsePipes(ValidationPipe)
  updateUserChallengeCode(
    @Body() challengeCodeDto: UserCodeBlobDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const { user } = req;
    return this.progressService.updateUserCodeBlob(challengeCodeDto, user);
  }
}
