import {
  ICodeBlobDto,
  BlobTypeSet,
  challengeUtilityClass,
  assertUnreachable,
  UserUpdateOptions,
  Result,
  Ok,
  Err,
  UserSettings,
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
 * before it is saved in the database.
 */
export const validateCodeBlob = (blob: ICodeBlobDto) => {
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

/**
 * Validate input to user update operation.
 */
export const validateUserUpdateDetails = (
  details: UserUpdateOptions,
): Result<UserUpdateOptions<string>, ERROR_CODES.INVALID_UPDATE_DETAILS> => {
  try {
    const updateDetails = {
      avatarUrl: checkStringField(details.avatarUrl),
      givenName: checkStringField(details.givenName),
      familyName: checkStringField(details.familyName),
      displayName: checkStringField(details.displayName),
      settings: checkSettingsField(details.settings),
    };

    const sanitizedUpdate = sanitizeObject(updateDetails);
    return new Ok(sanitizedUpdate);
  } catch (err) {
    return new Err(ERROR_CODES.INVALID_UPDATE_DETAILS);
  }
};

const checkStringField = (field: any) => {
  return typeof field === "string" ? field : null;
};

const checkNumberField = (field: any) => {
  return typeof field === "number" ? field : null;
};

/**
 * Validate the user settings JSON before update.
 */
const checkSettingsField = (settings?: UserSettings) => {
  if (settings) {
    const validSettings: UserSettings = {
      workspaceFontSize: checkNumberField(settings.workspaceFontSize),
    };

    const sanitizedUpdate = sanitizeObject(validSettings);
    return JSON.stringify(sanitizedUpdate);
  }

  return null;
};

/**
 * Remove [key]: null key:value pairs from an object.
 */
const sanitizeObject = (obj: any) => {
  const sanitizedUpdate = {};

  /* Only add fields which pass the check: */
  Object.entries(obj).forEach(([key, value]) => {
    if (value !== null) {
      sanitizedUpdate[key] = value;
    }
  });
  return sanitizedUpdate;
};
