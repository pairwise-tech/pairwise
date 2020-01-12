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
import { BlobDto } from "./blob.dto";
import { AuthGuard } from "@nestjs/passport";
import { AuthenticatedRequest } from "src/types";
import { BlobService } from "./blob.service";

@Controller("blob")
export class BlobController {
  constructor(private readonly blobService: BlobService) {}

  @UseGuards(AuthGuard("jwt"))
  @Get(":id")
  fetchUserChallengeHistory(@Param() params, @Req() req: AuthenticatedRequest) {
    const { id } = params;
    return this.blobService.fetchUserCodeBlob(req.user, id);
  }

  @UseGuards(AuthGuard("jwt"))
  @Post()
  @UsePipes(ValidationPipe)
  updateUserChallengeCode(
    @Body() challengeCodeDto: BlobDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const { user } = req;
    return this.blobService.updateUserCodeBlob(challengeCodeDto, user);
  }
}
