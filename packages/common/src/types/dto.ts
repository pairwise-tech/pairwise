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

export interface IUserDto {
  profile: {
    uuid: string;
    email: string;
    displayName: string;
    givenName: string;
    familyName: string;
  };
  payments: Payment[];
}

interface Payment {
  courseId: string;
  datePaid: string;
}

export interface IUserCourseProgressDto {
  passed: boolean;
  challengeId: string;
}

export interface IUserCodeBlobDto {
  dataBlob: string;
  challengeId: string;
}

/** ===========================================================================
 * Code Blobs
 * ============================================================================
 */

export type BlobType = "video" | "challenge" | "project" | "guided_project";

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
  status: boolean;
}

/**
 * Map of {[challengeId]: ChallengeStatus} for a given course.
 */
export interface UserCourseProgress {
  [key: string]: ChallengeStatus;
}
