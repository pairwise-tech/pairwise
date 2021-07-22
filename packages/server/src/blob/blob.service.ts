import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  ContentUtility,
  ICodeBlobDto,
  CodeBlobBulk,
  NullBlob,
  UserProfile,
} from "@pairwise/common";
import { CodeBlob } from "./blob.entity";
import { ERROR_CODES, SUCCESS_CODES } from "../tools/constants";
import { validateCodeBlob } from "../tools/validation-utils";
import { RequestUser } from "../types";

@Injectable()
export class BlobService {
  constructor(
    @InjectRepository(CodeBlob)
    private readonly userCodeBlobRepository: Repository<CodeBlob>,
  ) {}

  public async fetchUserCodeBlobForChallengeByAdmin(
    user: UserProfile,
    challengeId: string,
  ): Promise<ICodeBlobDto | NullBlob> {
    // Verify the challenge id is valid
    if (!ContentUtility.challengeIdIsValid(challengeId)) {
      throw new BadRequestException(ERROR_CODES.INVALID_PARAMETERS);
    }

    const blob = await this.userCodeBlobRepository.findOne({
      user,
      challengeId,
    });

    if (blob) {
      // Deserialize data blob before sending back to the client.
      const deserialized: ICodeBlobDto = {
        ...blob,
        dataBlob: JSON.parse(blob.dataBlob),
      };
      return deserialized;
    } else {
      // Return a null blob. This is used to represent a not found resource,
      // rather than throwing an error. Since blobs are frequently requested
      // on the client, I found the stream of 404 HTTP errors to feel
      // uncomfortable. These pollute the browser console, which the user
      // may be looking at to check challenge output, for instance.
      return { dataBlob: null, challengeId: null };
    }
  }

  public async fetchUserCodeBlobForChallenge(
    user: RequestUser,
    challengeId: string,
  ): Promise<ICodeBlobDto | NullBlob> {
    // Verify the challenge id is valid
    if (!ContentUtility.challengeIdIsValid(challengeId)) {
      throw new BadRequestException(ERROR_CODES.INVALID_PARAMETERS);
    }

    const blob = await this.userCodeBlobRepository.findOne({
      user: user.profile,
      challengeId,
    });

    if (blob) {
      // Deserialize data blob before sending back to the client.
      const deserialized: ICodeBlobDto = {
        ...blob,
        dataBlob: JSON.parse(blob.dataBlob),
      };
      return deserialized;
    } else {
      // Return a null blob. This is used to represent a not found resource,
      // rather than throwing an error. Since blobs are frequently requested
      // on the client, I found the stream of 404 HTTP errors to feel
      // uncomfortable. These pollute the browser console, which the user
      // may be looking at to check challenge output, for instance.
      return { dataBlob: null, challengeId: null };
    }
  }

  public async updateUserCodeBlob(
    challengeCodeDto: ICodeBlobDto,
    user: RequestUser,
  ) {
    // Validate the code blob, this will throw if invalid:
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
         * input is mal-formed. Allow failures and continue for other entries.
         */
        await this.updateUserCodeBlob(blob, user);
      } catch (err) {
        // No action, errors will be reported by updateUserCodeBlob.
      }
    }

    return SUCCESS_CODES.OK;
  }
}
