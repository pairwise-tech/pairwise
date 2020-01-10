/** ===========================================================================
 * DTO interfaces
 * ----------------------------------------------------------------------------
 * These types represent shared data transfer objects which map API JSON
 * data between the client and server. Generally, these types are represented
 * in the API request/response values and also sometimes in the entity
 * definitions for database types. The source of truth for these type
 * definitions is here and shared between the client and server.
 *
 * The convention is for all of the actual DTOs to use I as a prefix in the
 * name of the interface. This is to avoid name collisions with the entities
 * which implement these DTOs on the server.
 * ============================================================================
 */

/** ===========================================================================
 * User Profile and Payment Types
 * ============================================================================
 */

export interface UserProfile {
  uuid: string;
  email: string;
  displayName: string;
  givenName: string;
  familyName: string;
  profileImageUrl: string;
  lastActiveChallengeId: string;
}

export interface IUserDto<T = UserProfile> {
  profile: T;
  payments: Payment[];
  courses: { [key: string]: boolean };
}

/**
 * Only these fields can be updated on the user object by the
 * POST user/profile API. This validation is applied on the server.
 */
export interface UserUpdateOptions {
  givenName?: string;
  familyName?: string;
  displayName?: string;
  profileImageUrl?: string;
}

interface Payment {
  courseId: string;
  datePaid: Date;
  amountPaid: number;
  extraData?: string /* generic json data */;
  type: PAYMENT_TYPE;
}

export type PAYMENT_TYPE = "SUCCESS" | "FAILURE" | "REFUNDED";

export type COURSE_ACCESS_LEVEL = "FREE" | "PAID";

/** ===========================================================================
 * Feedback Types
 * ============================================================================
 */

export type FEEDBACK_TYPE = "TOO_HARD" | "TOO_EASY" | "NOT_HELPFUL" | "OTHER";

export const feedbackTypeSet: Set<FEEDBACK_TYPE> = new Set([
  "TOO_HARD",
  "TOO_EASY",
  "NOT_HELPFUL",
  "OTHER",
]);

export interface IFeedbackDto {
  feedback: string;
  challengeId: string;
  type: FEEDBACK_TYPE;
}

/** ===========================================================================
 * Code Blobs for Challenges
 * ============================================================================
 */

export type BLOB_TYPE = "video" | "challenge" | "project" | "guided_project";

export const BlobTypeSet: Set<BLOB_TYPE> = new Set([
  "video",
  "challenge",
  "project",
  "guided_project",
]);

interface BlobBase {
  type: BLOB_TYPE;
  created_at: number;
  updated_at: number /* Date? */;
}

export interface CodeChallengeBlob extends BlobBase {
  type: "challenge";
  code: string;
}

export interface VideoChallengeBlob extends BlobBase {
  type: "video";
  timeLastWatched: number;
}

export interface ProjectChallengeBlob extends BlobBase {
  type: "project";
  url: string;
  repo: string;
  timeLastWatched: number;
}

export interface GuidedProjectBlob extends BlobBase {
  type: "guided_project";
  timeLastWatched: number;
}

export type DataBlob =
  | VideoChallengeBlob
  | ProjectChallengeBlob
  | CodeChallengeBlob
  | GuidedProjectBlob;

export interface ICodeBlobDto {
  dataBlob: DataBlob;
  challengeId: string;
}

/** ===========================================================================
 * User Challenge History
 * ============================================================================
 */

/**
 * Represent all 3 states for a challenge:
 *
 * true: completed
 * false: incomplete
 * undefined: never attempted
 */
export interface ChallengeStatus {
  complete: boolean;
}

export interface IProgressDto extends ChallengeStatus {
  challengeId: string;
  courseId: string;
}

/**
 * Map of {[challengeId]: ChallengeStatus} for a given course.
 */
export interface UserCourseStatus {
  [key: string]: ChallengeStatus;
}
