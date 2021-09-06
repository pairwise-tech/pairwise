import {
  AppTheme,
  ICodeBlobDto,
  BlobTypeSet,
  ContentUtility,
  assertUnreachable,
  UserUpdateOptions,
  Result,
  Ok,
  Err,
  UserSettings,
  ProgressEntity,
  IFeedbackDto,
  feedbackTypeSet,
  MonacoEditorThemes,
  IUserDto,
  UserProfile,
  ILastActiveIdsDto,
  canDisconnectAccountRequest,
  PAYMENT_PLAN,
} from "@pairwise/common";
import validator from "validator";
import { BadRequestException } from "@nestjs/common";
import { ERROR_CODES } from "./constants";
import { ProgressDto } from "../progress/progress.dto";
import { RequestUser } from "../types";
import { captureSentryException } from "./sentry-utils";

/** ===========================================================================
 * Validation Utils
 * ============================================================================
 */

/**
 * The time must be a positive number, or zero.
 */
const validateTimeLastWatched = (time: number) => {
  if (isNaN(time) || time < 0) {
    return true;
  }

  return false;
};

/**
 * Perform validation on the user code blob which gets serialized to JSON
 * before it is saved in the database.
 */
export const validateCodeBlob = (blob: ICodeBlobDto) => {
  try {
    if (!blob.dataBlob.type) {
      captureSentryException(
        `Missing blob type, received: JSON.stringify(${blob})`,
      );
      throw new BadRequestException(ERROR_CODES.INVALID_CODE_BLOB);
    }

    if (!BlobTypeSet.has(blob.dataBlob.type)) {
      captureSentryException(
        `Invalid blob type, received: ${blob.dataBlob.type}`,
      );
      throw new BadRequestException(ERROR_CODES.INVALID_CODE_BLOB);
    }

    if (!ContentUtility.challengeIdIsValid(blob.challengeId)) {
      captureSentryException(
        `Invalid blob type, received: ${blob.challengeId}`,
      );
      throw new BadRequestException(ERROR_CODES.INVALID_CHALLENGE_ID);
    }

    const { dataBlob } = blob;

    switch (dataBlob.type) {
      case "challenge": {
        const { code } = dataBlob;
        if (!code || typeof code !== "string") {
          captureSentryException(
            `Invalid blob code value, received: ${JSON.stringify(code)}`,
          );
          throw new BadRequestException(ERROR_CODES.INVALID_CODE_BLOB);
        }
        break;
      }
      case "video": {
        const { timeLastWatched } = dataBlob;
        if (validateTimeLastWatched(timeLastWatched)) {
          captureSentryException(
            `Invalid timeLastWatched value, received: ${timeLastWatched}`,
          );
          throw new BadRequestException(ERROR_CODES.INVALID_CODE_BLOB);
        }
        break;
      }
      case "project": {
        const { url, repo, timeLastWatched } = dataBlob;
        if (validateTimeLastWatched(timeLastWatched)) {
          captureSentryException(
            `Invalid timeLastWatched value, received: ${timeLastWatched}`,
          );
          throw new BadRequestException(ERROR_CODES.INVALID_CODE_BLOB);
        } else if (!!url && !validator.isURL(url)) {
          // Only validate url if it is present (it is optional)
          captureSentryException(
            `Invalid url value received for project, received: ${url}`,
          );
          throw new BadRequestException(ERROR_CODES.INVALID_CODE_BLOB);
        } else if (!validator.isURL(repo)) {
          captureSentryException(
            `Invalid repo url value received for project, received: ${repo}`,
          );
          throw new BadRequestException(ERROR_CODES.INVALID_CODE_BLOB);
        }
        break;
      }
      case "guided_project": {
        const { timeLastWatched } = dataBlob;
        if (validateTimeLastWatched(timeLastWatched)) {
          captureSentryException(
            `Invalid timeLastWatched value, received: ${timeLastWatched}`,
          );
          throw new BadRequestException(ERROR_CODES.INVALID_CODE_BLOB);
        }
        break;
      }
      case "sandbox": {
        captureSentryException("Sandbox blob is not supported yet!");
        throw new BadRequestException(ERROR_CODES.INVALID_CODE_BLOB);
      }
      default: {
        const { type } = dataBlob;
        return assertUnreachable(type);
      }
    }
  } catch (error) {
    throw error;
  }
};

/**
 * Validate the input request to update user progress history.
 */
export const validateChallengeProgressDto = (progressDto: ProgressDto) => {
  try {
    const { courseId, challengeId } = progressDto;
    if (!ContentUtility.courseIdIsValid(courseId)) {
      captureSentryException(`Invalid course id, received: ${courseId}`);
      throw new BadRequestException(ERROR_CODES.INVALID_COURSE_ID);
    } else if (
      !ContentUtility.challengeIdInCourseIsValid(courseId, challengeId)
    ) {
      captureSentryException(
        `Invalid challenge id, received: ${JSON.stringify(progressDto)}`,
      );
      throw new BadRequestException(ERROR_CODES.INVALID_CHALLENGE_ID);
    }
  } catch (error) {
    throw error;
  }
};

/**
 * Validate input to user update operation. This method will filter any
 * invalid update parameters and return a validated object with values which
 * can be updated on the user.
 */
export const validateUserUpdateDetails = (
  user: RequestUser,
  details: UserUpdateOptions,
): Result<UserUpdateOptions<string>, ERROR_CODES.INVALID_PARAMETERS> => {
  try {
    if ("email" in details) {
      throw new Error("Not allowed to update email directly!");
    }

    const settingsUpdate = checkSettingsField(details.settings);
    const mergedSettings = { ...user.settings, ...settingsUpdate };
    const settingsJSON = JSON.stringify(mergedSettings);

    // Does NOT include email:
    const updateDetails = {
      avatarUrl: checkStringField(details.avatarUrl),
      givenName: checkStringField(details.givenName),
      familyName: checkStringField(details.familyName),
      displayName: checkStringField(details.displayName),
      settings: settingsJSON,
    };

    const sanitizedUpdate = sanitizeObject(updateDetails);
    return new Ok(sanitizedUpdate);
  } catch (err) {
    captureSentryException(err);
    return new Err(ERROR_CODES.INVALID_PARAMETERS);
  }
};

/**
 * Validate a payload request for updating the last active challenge ids
 * for a user.
 */
export const validateLastActiveChallengeIdsPayload = (
  lastActiveIds: ILastActiveIdsDto,
) => {
  const { courseId, challengeId } = lastActiveIds;
  return ContentUtility.challengeIdInCourseIsValid(courseId, challengeId);
};

/**
 * Validate an email address.
 */
export const validateEmailUpdateRequest = (value: string) => {
  if (validator.isEmail(value)) {
    return value;
  } else {
    return null;
  }
};

const checkStringField = (value: any, rejectEmptyValues = false) => {
  if (typeof value === "string") {
    if (rejectEmptyValues && value === "") {
      throw new Error("Field cannot be empty!");
    }

    return value;
  }

  return null;
};

const checkNumberField = (value: any) => {
  return typeof value === "number" ? value : null;
};

const checkBooleanField = (value: any) => {
  return typeof value === "boolean" ? value : null;
};

const checkThemeField = (theme: any): MonacoEditorThemes => {
  return Object.values(MonacoEditorThemes).includes(theme) ? theme : null;
};

const checkAppThemeField = (theme: any): AppTheme => {
  return theme === "dark" || theme === "light" ? theme : null;
};

/**
 * Validate the user settings JSON before update.
 */
const checkSettingsField = (settings?: Partial<UserSettings>) => {
  if (settings) {
    const validSettings: UserSettings = {
      appTheme: checkAppThemeField(settings.appTheme),
      editorTheme: checkThemeField(settings.editorTheme),
      fullScreenEditor: checkBooleanField(settings.fullScreenEditor),
      workspaceFontSize: checkNumberField(settings.workspaceFontSize),
    };

    return sanitizeObject(validSettings);
  }

  return {};
};

/**
 * Remove [key]: null key:value pairs from an object.
 */
const sanitizeObject = (obj: any) => {
  const sanitizedObject = {};

  /* Only add fields which pass the check: */
  Object.entries(obj).forEach(([key, value]) => {
    if (value !== null) {
      sanitizedObject[key] = value;
    }
  });

  return sanitizedObject;
};

/**
 * Validate a progress item before update/insertion. Throw an error if the
 * entire object is mal-formed, otherwise proceed with validating each
 * entry.
 *
 * Return a sanitized object which can be persisted confidently.
 */
export const validateAndSanitizeProgressItem = (entity: ProgressEntity) => {
  try {
    const { progress, courseId } = entity;

    if (!ContentUtility.courseIdIsValid(courseId)) {
      captureSentryException(`Course id is invalid, received: ${courseId}`);
      throw new BadRequestException(ERROR_CODES.INVALID_COURSE_ID);
    }

    const sanitizedProgress = Object.entries(progress).reduce(
      (sanitized, [challengeId, status]) => {
        /**
         * Validate the progress item:
         */
        if (ContentUtility.challengeIdInCourseIsValid(courseId, challengeId)) {
          if (typeof status.complete === "boolean") {
            return {
              ...sanitized,
              [challengeId]: status,
            };
          }

          return sanitized;
        }
      },
      {},
    );

    if (Object.keys(sanitizedProgress).length > 0) {
      const result: ProgressEntity = {
        courseId,
        progress: sanitizedProgress,
      };
      return result;
    } else {
      captureSentryException(
        `Invalid progress item, received: ${JSON.stringify(entity)}`,
      );
      throw new BadRequestException(ERROR_CODES.INVALID_PARAMETERS);
    }
  } catch (error) {
    throw error;
  }
};

// Validate the user request to purchase a course. The course id must be valid
// and the user must not have already purchased this course before.
export const validatePaymentRequest = (
  user: IUserDto<UserProfile>,
  courseId: string,
  plan: PAYMENT_PLAN,
) => {
  // A valid user is required
  if (!user) {
    throw new BadRequestException(ERROR_CODES.MISSING_USER);
  }

  // The course id must be valid
  if (!ContentUtility.courseIdIsValid(courseId)) {
    throw new BadRequestException(ERROR_CODES.INVALID_COURSE_ID);
  }

  // Validate the provided payment plan
  validatePaymentPlan(plan);

  const existingCoursePayment = user.payments.find(
    (p) => p.courseId === courseId,
  );

  // The user must no have already paid for the course
  if (existingCoursePayment) {
    throw new BadRequestException("User has already paid for this course");
  }
};

// Validate a refund request for a course
export const validateRefundRequest = (
  user: IUserDto<UserProfile>,
  courseId: string,
) => {
  // A valid user is required
  if (!user) {
    throw new BadRequestException(ERROR_CODES.MISSING_USER);
  }

  // The course id must be valid
  if (!ContentUtility.courseIdIsValid(courseId)) {
    throw new BadRequestException(ERROR_CODES.INVALID_COURSE_ID);
  }

  const existingCoursePayment = user.payments.find(
    (p) => p.courseId === courseId,
  );

  // The course must exist and not be refunded already
  if (!existingCoursePayment) {
    throw new BadRequestException("The user has not purchased this course");
  } else if (existingCoursePayment.status === "REFUNDED") {
    throw new BadRequestException("The course is already refunded");
  }
};

/**
 * Validating the feedback dto.
 */
export const validateFeedbackDto = (feedbackDto: IFeedbackDto) => {
  if (!ContentUtility.challengeIdIsValid(feedbackDto.challengeId)) {
    captureSentryException(
      `Invalid blob type, received: ${feedbackDto.challengeId}`,
    );
    throw new BadRequestException(ERROR_CODES.INVALID_CHALLENGE_ID);
  } else if (!feedbackTypeSet.has(feedbackDto.type)) {
    throw new BadRequestException(ERROR_CODES.INVALID_FEEDBACK_TYPE);
  }
};

/**
 * Do not allow a user to disconnect all their social accounts without
 * a verified email.
 */
export const validateDisconnectAccountRequest = (profile: UserProfile) => {
  if (!canDisconnectAccountRequest(profile)) {
    throw new BadRequestException(
      "You cannot disconnect all social accounts without a verified email.",
    );
  }
};

/**
 * Validate a provided payment plan value.
 */
export const validatePaymentPlan = (plan: PAYMENT_PLAN) => {
  if (plan === "REGULAR" || plan === "PREMIUM") {
    return true;
  } else {
    throw new BadRequestException("Invalid payment plan provided.");
  }
};
