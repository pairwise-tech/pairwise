import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  challengeUtilityClass,
  ICodeBlobDto,
  CodeBlobBulk,
} from "@pairwise/common";
import { CodeBlob } from "./blob.entity";
import { ERROR_CODES, SUCCESS_CODES } from "src/tools/constants";
import { validateCodeBlob } from "src/tools/validation";
import { RequestUser } from "src/types";
import { UserService } from "src/user/user.service";
import { ObjectUnsubscribedError } from "rxjs";

@Injectable()
export class BlobService {
  constructor(
    private readonly userService: UserService,

    @InjectRepository(CodeBlob)
    private readonly userCodeBlobRepository: Repository<CodeBlob>,
  ) {}

  async fetchUserCodeBlob(user: RequestUser, challengeId: string) {
    /* Verify the challenge id is valid */
    if (!challengeUtilityClass.challengeIdIsValid(challengeId)) {
      throw new BadRequestException(ERROR_CODES.INVALID_UPDATE_DETAILS);
    }

    /**
     * [SIDE EFFECT!]
     *
     * Update the lastActiveChallengeId on this user to be this challenge
     * which they are fetching user code history for.
     */
    await this.userService.updateLastActiveChallengeId(user, challengeId);

    const codeHistory = await this.userCodeBlobRepository.findOne({
      user: user.profile,
      challengeId,
    });

    if (codeHistory) {
      /**
       * Deserialize data blog before sending back to the client.
       */
      const deserialized = {
        ...codeHistory,
        dataBlob: JSON.parse(codeHistory.dataBlob),
      };
      return deserialized;
    } else {
      throw new NotFoundException(
        "No history found for this challenge for this user.",
      );
    }
  }

  async updateUserCodeBlob(challengeCodeDto: ICodeBlobDto, user: RequestUser) {
    /* Validate everything in the code blob */
    validateCodeBlob(challengeCodeDto);

    const existingBlob = await this.userCodeBlobRepository.findOne({
      user: user.profile,
      challengeId: challengeCodeDto.challengeId,
    });

    const blob = {
      challengeId: challengeCodeDto.challengeId,
      dataBlob: JSON.stringify(challengeCodeDto.dataBlob),
    };

    /**
     * Upsert (no typeorm method exist, ha, ha):
     */
    if (existingBlob) {
      await this.userCodeBlobRepository.update(
        {
          uuid: existingBlob.uuid,
        },
        blob,
      );
    } else {
      await this.userCodeBlobRepository.insert({
        user: user.profile,
        challengeId: challengeCodeDto.challengeId,
        dataBlob: JSON.stringify(challengeCodeDto.dataBlob),
      });
    }

    return SUCCESS_CODES.OK;
  }

  async persistBulkBlobs(blobs: CodeBlobBulk, user: RequestUser) {
    console.log(
      `[BULK]: Persisting bulk blobs for user: ${user.profile.email}`,
    );
    for (const [_, blob] of Object.entries(blobs)) {
      await this.updateUserCodeBlob(blob, user);
    }
  }
}
