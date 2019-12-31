import {
  Controller,
  Post,
  Body,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { UserCourseProgressDto } from "./userCourseProgress.dto";
import { ProgressService } from "./progress.service";
import { UserCodeBlobDto } from "./userCodeBlob.dto";
import { AuthGuard } from "@nestjs/passport";

@Controller("progress")
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @UseGuards(AuthGuard("jwt"))
  @Post()
  @UsePipes(ValidationPipe)
  updateUserChallengeProgress(
    @Body() challengeProgressDto: UserCourseProgressDto,
  ) {
    return this.progressService.updateUserProgressHistory(challengeProgressDto);
  }

  @UseGuards(AuthGuard("jwt"))
  @Post("/challenge")
  @UsePipes(ValidationPipe)
  updateUserChallengeCode(@Body() challengeCodeDto: UserCodeBlobDto) {
    this.progressService.updateUserCodeHistory(challengeCodeDto);
  }
}
