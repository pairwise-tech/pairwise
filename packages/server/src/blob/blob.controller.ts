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
import { AuthenticatedRequest } from "../types";
import { BlobService } from "./blob.service";
import { CodeBlobBulk } from "@pairwise/common";
import { SUCCESS_CODES } from "../tools/constants";

@Controller("blob")
export class BlobController {
  constructor(private readonly blobService: BlobService) {}

  @UseGuards(AuthGuard("jwt"))
  @Get(":id")
  public fetchUserChallengeHistory(
    @Param() params,
    @Req() req: AuthenticatedRequest,
  ) {
    const { id } = params;
    return this.blobService.fetchUserCodeBlob(req.user, id);
  }

  @UseGuards(AuthGuard("jwt"))
  @Post()
  @UsePipes(ValidationPipe)
  public updateUserChallengeCode(
    @Body() challengeCodeDto: BlobDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const { user } = req;
    return this.blobService.updateUserCodeBlob(challengeCodeDto, user);
  }

  @UseGuards(AuthGuard("jwt"))
  @Post("/bulk")
  @UsePipes(ValidationPipe)
  public async updateUserChallengeCodeBulk(
    @Body() codeBlobBulk: CodeBlobBulk,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.blobService.persistBulkBlobs(codeBlobBulk, req.user);
    return SUCCESS_CODES.OK;
  }
}
