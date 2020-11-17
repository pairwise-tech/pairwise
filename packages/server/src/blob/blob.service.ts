import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ContentUtility, ICodeBlobDto, CodeBlobBulk } from "@pairwise/common";
import { CodeBlob } from "./blob.entity";
import { ERROR_CODES, SUCCESS_CODES } from "../tools/constants";
import { validateCodeBlob } from "../tools/validation";
import { RequestUser } from "../types";
import { captureSentryException } from "../tools/sentry-utils";

@Injectable()
export class BlobService {
  constructor(
    @InjectRepository(CodeBlob)
    private readonly userCodeBlobRepository: Repository<CodeBlob>,
  ) {}

  public async fetchUserCodeBlob(user: RequestUser, challengeId: string) {
    /* Verify the challenge id is valid */
    if (!ContentUtility.challengeIdIsValid(challengeId)) {
      throw new BadRequestException(ERROR_CODES.INVALID_PARAMETERS);
    }

    const blob = await this.userCodeBlobRepository.findOne({
      user: user.profile,
      challengeId,
    });

    if (blob) {
      /**
       * Deserialize data blob before sending back to the client.
       */
      const deserialized = {
        ...blob,
        dataBlob: JSON.parse(blob.dataBlob),
      };
      return deserialized;
    } else {
      throw new NotFoundException(
        "No history found for this challenge for this user.",
      );
    }
  }

  public async updateUserCodeBlob(
    challengeCodeDto: ICodeBlobDto,
    user: RequestUser,
  ) {
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

    // Upsert blob (no typeorm method exists for this operation):
    if (existingBlob) {
      await this.userCodeBlobRepository.update(
        {
          uuid: existingBlob.uuid,
        },
        blob,
      );
    } else {
      // Insert new blob:
      await this.userCodeBlobRepository.insert({
        user: user.profile,
        challengeId: challengeCodeDto.challengeId,
        dataBlob: JSON.stringify(challengeCodeDto.dataBlob),
      });
    }

    return SUCCESS_CODES.OK;
  }

  public async persistBulkBlobs(blobs: CodeBlobBulk, user: RequestUser) {
    console.log(`Persisting bulk blobs for user: ${user.profile.uuid}`);

    for (const [_, blob] of Object.entries(blobs)) {
      try {
        /**
         * This method performs input validation, but it could fail if the
         * input is mal-formed. If it does, don't just silent fail and continue
         * the total operation.
         */
        await this.updateUserCodeBlob(blob, user);
      } catch (err) {
        captureSentryException(err);
      }
    }

    return SUCCESS_CODES.OK;
  }
}
