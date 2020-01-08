/** ===========================================================================
 * Shared error and success constants
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
  INVALID_UPDATE_DETAILS = "Invalid update parameters provided",
}

enum SUCCESS_CODES {
  OK = "Success",
}

/** ===========================================================================
 * Export
 * ============================================================================
 */

export { SUCCESS_CODES, ERROR_CODES };
