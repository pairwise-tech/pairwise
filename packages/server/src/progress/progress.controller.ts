import { Controller, Post, Body } from "@nestjs/common";
import { UserCourseProgressDto } from "./userCourseProgress.dto";
import { ProgressService } from "./progress.service";
import { UserCodeBlobDto } from "./userCodeBlob.dto";

@Controller("progress")
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Post()
  updateUserChallengeProgress(
    @Body() challengeProgressDto: UserCourseProgressDto,
  ) {
    return this.progressService.updateUserProgressHistory(challengeProgressDto);
  }

  @Post("/challenge")
  updateUserChallengeCode(@Body() challengeCodeDto: UserCodeBlobDto) {
    this.progressService.updateUserCodeHistory(challengeCodeDto);
  }
}
