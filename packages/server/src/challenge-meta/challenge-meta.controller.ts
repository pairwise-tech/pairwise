import { Controller, UseGuards, Get, Req, Param } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AuthenticatedRequest } from "../types";
import { ChallengeMetaService } from "./challenge-meta.service";

@Controller("challenge-meta")
export class ChallengeMetaController {
  constructor(private readonly challengeMetaService: ChallengeMetaService) {}

  // @UseGuards(AuthGuard("jwt"))
  @Get(":id")
  public fetchChallengeMeta(@Param() params, @Req() req: AuthenticatedRequest) {
    const { id } = params;
    return this.challengeMetaService.fetchChallengeMeta(req.user, id);
  }
}
