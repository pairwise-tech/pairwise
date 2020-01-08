import {
  IUserCodeBlobDto,
  BlobTypeSet,
  challengeUtilityClass,
  assertUnreachable,
  UserUpdateOptions,
  Result,
  Ok,
  Err,
} from "@pairwise/common";
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

const checkField = (field: any) => {
  if (typeof field === "string") {
    return field;
  }
  return null;
};

/**
 * Validate input to user update operation.
 */
export const validateUserUpdateDetails = (
  details: UserUpdateOptions,
): Result<UserUpdateOptions, ERROR_CODES.INVALID_UPDATE_DETAILS> => {
  try {
    const updateDetails = {
      givenName: checkField(details.givenName),
      familyName: checkField(details.familyName),
      displayName: checkField(details.displayName),
      profileImageUrl: checkField(details.profileImageUrl),
      lastActiveChallengeId: checkField(details.lastActiveChallengeId),
    };

    const sanitizedUpdate = {};

    Object.entries(updateDetails).forEach(([key, value]) => {
      if (value) {
        sanitizedUpdate[key] = value;
      }
    });

    return new Ok(sanitizedUpdate);
  } catch (err) {
    return new Err(ERROR_CODES.INVALID_UPDATE_DETAILS);
  }
};
