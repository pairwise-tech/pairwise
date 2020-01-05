import {
  IUserCodeBlobDto,
  BlobTypeSet,
  challengeUtilityClass,
  assertUnreachable,
} from "@prototype/common";
import validator from "validator";
import { BadRequestException } from "@nestjs/common";
import { ERROR_CODES } from "./constants";

/** ===========================================================================
 * Validation Utils
 * ============================================================================
 */

const validateTimeLastWatched = (time: number) => {
  if (!time || typeof time !== "number" || time < 0) {
    return true;
  }

  return false;
};

/**
 * Perform validation on the user code blob which gets serialized to JSON
 * before it is saved in the databse.
 */
export const validateCodeBlob = (blob: IUserCodeBlobDto) => {
  if (!blob.dataBlob.type) {
    throw new BadRequestException(ERROR_CODES.INVALID_CODE_BLOB);
  }

  if (!BlobTypeSet.has(blob.dataBlob.type)) {
    throw new BadRequestException(ERROR_CODES.INVALID_CODE_BLOB);
  }

  if (!challengeUtilityClass.challengeIdIsValid(blob.challengeId)) {
    throw new BadRequestException(ERROR_CODES.INVALID_CHALLENGE_ID);
  }

  const { dataBlob } = blob;

  switch (dataBlob.type) {
    case "challenge": {
      const { code } = dataBlob;
      if (!code || typeof code !== "string") {
        throw new BadRequestException("Invalid ChallengeBlob");
      }
      break;
    }
    case "video": {
      const { timeLastWatched } = dataBlob;
      if (validateTimeLastWatched(timeLastWatched)) {
        throw new BadRequestException("Invalid timeLastWatched value received");
      }
      break;
    }
    case "project": {
      const { url, repo, timeLastWatched } = dataBlob;
      if (validateTimeLastWatched(timeLastWatched)) {
        throw new BadRequestException("Invalid timeLastWatched value received");
      } else if (!validator.isURL(url)) {
        throw new BadRequestException("Invalid url value received for project");
      } else if (!validator.isURL(repo)) {
        throw new BadRequestException(
          "Invalid repo url value received for project",
        );
      }
      break;
    }
    case "guided_project": {
      const { timeLastWatched } = dataBlob;
      if (validateTimeLastWatched(timeLastWatched)) {
        throw new BadRequestException("Invalid timeLastWatched value received");
      }
      break;
    }
    default: {
      const { type } = dataBlob;
      return assertUnreachable(type);
    }
  }
};
