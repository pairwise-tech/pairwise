import {
  Controller,
  Post,
  Body,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Get,
  Req,
} from "@nestjs/common";
import { ProgressDto } from "./progress.dto";
import { ProgressService } from "./progress.service";
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
    @Body() challengeProgressDto: ProgressDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.progressService.updateUserProgressHistory(
      req.user,
      challengeProgressDto,
    );
  }
}
