/** ===========================================================================
 * DTO interfaces
 * ----------------------------------------------------------------------------
 * These types represent shared data transfer objects which map API JSON
 * data between the client and server. Generally, these types are represented
 * in the API request/response values and also sometimes in the entity
 * definitions for database types. The source of truth for these type
 * definitions is here and shared between the client and server.
 * ============================================================================
 */

/** ===========================================================================
 * User Profile and Payment Types
 * ============================================================================
 */

export interface IUserDto {
  profile: {
    uuid: string;
    email: string;
    displayName: string;
    givenName: string;
    familyName: string;
    profileImageUrl: string;
    lastActiveChallengeId: string;
  };
  payments: Payment[];
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
  extraData?: string /* json */;
}

/** ===========================================================================
 * Code Blobs for Challenges
 * ============================================================================
 */

export type BlobType = "video" | "challenge" | "project" | "guided_project";

export const BlobTypeSet: Set<BlobType> = new Set([
  "video",
  "challenge",
  "project",
  "guided_project",
]);

interface BlobBase {
  type: BlobType;
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

export type CodeHistoryBlob =
  | VideoChallengeBlob
  | ProjectChallengeBlob
  | CodeChallengeBlob
  | GuidedProjectBlob;

export interface IUserCodeBlobDto {
  dataBlob: CodeHistoryBlob;
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

export interface IUserCourseProgressDto extends ChallengeStatus {
  challengeId: string;
  courseId: string;
}

/**
 * Map of {[challengeId]: ChallengeStatus} for a given course.
 */
export interface UserCourseStatus {
  [key: string]: ChallengeStatus;
}
