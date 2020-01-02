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
