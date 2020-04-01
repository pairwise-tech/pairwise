/** ===========================================================================
 * Shared error and success codes
 * ----------------------------------------------------------------------------
 * These values are intended to be used for shared/common response messages
 * which are used in more than one place.
 * ============================================================================
 */

enum ERROR_CODES {
  INVALID_COURSE_ID = "The courseId is invalid",
  INVALID_CHALLENGE_ID = "The challengeId is invalid",
  INVALID_CODE_BLOB = "The code blob is invalid",
  MISSING_USER = "No user could be found",
  INVALID_PARAMETERS = "Invalid parameters provided",
  INVALID_FEEDBACK_TYPE = "Invalid feedback type used",
  UNKNOWN_LOGIN_ERROR = "There was an unknown login error",
  EMAIL_LOGIN_ERROR = "An error occurred in the email login flow",
  FAILED_TO_SEND_EMAIL = "FAILED_TO_SEND_EMAIL",
}

enum SUCCESS_CODES {
  OK = "Success",
}

/** ===========================================================================
 * Export
 * ============================================================================
 */

export { SUCCESS_CODES, ERROR_CODES };
