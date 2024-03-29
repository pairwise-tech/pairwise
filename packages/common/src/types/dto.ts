import {
  Challenge,
  CHALLENGE_TYPE,
  CourseList,
  CourseSkeletonList,
  PortfolioSkillSummaryMap,
} from "./courses";

type Nullable<T> = T | null;

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
 * User Object
 * ----------------------------------------------------------------------------
 * The user dto contains the user profile, settings, payments, courses,
 * and their progress history. These are all consolidated onto one object
 * for convenience.
 * ============================================================================
 */

export interface UserProfile {
  uuid: string;
  email: string | null;
  emailVerified: boolean | null;
  username: string | null;
  givenName: string;
  familyName: string;
  avatarUrl: string;
  coachingSessions: number;
  googleAccountId: string | null;
  facebookAccountId: string | null;
  githubAccountId: string | null;
  optInPublicProfile: boolean;
  optInShareAnonymousGeolocationActivity: boolean;
}

export type AppTheme = "dark" | "light";

export type ConsoleDarkTheme = "standard" | "terminal-dark";

export enum MonacoEditorThemes {
  DEFAULT = "vs-dark",
  DARK = "vs-dark",
  LIGHT = "light",
  HIGH_CONTRAST = "hc-black",
}

/**
 * The source of truth for client and server for the JSON blob user
 * settings object!
 *
 * Type definition and default settings object:
 */
export interface UserSettings {
  workspaceFontSize: number;
  fullScreenEditor: boolean;
  appTheme: AppTheme;
  editorTheme: MonacoEditorThemes;
  consoleDarkTheme: ConsoleDarkTheme;
}

export const defaultUserSettings: UserSettings = {
  workspaceFontSize: 16,
  fullScreenEditor: false,
  appTheme: "dark",
  editorTheme: MonacoEditorThemes.DEFAULT,
  consoleDarkTheme: "standard",
};

export interface IUserDto<Profile = UserProfile> {
  profile: Profile;
  payments: Payment[];
  settings: UserSettings;
  courses: UserCourseAccessMap;
  progress: UserProgressMap;
  lastActiveChallengeIds: LastActiveChallengeIds;
}

export interface UserCourseAccessMap {
  [key: string]: boolean;
}

export interface UserProgressMap {
  [key: string]: UserCourseStatus;
}

export interface LastActiveChallengeIds {
  [key: string]: string;
  lastActiveChallenge?: string;
}

export interface LeaderboardEntryDto {
  isUser: boolean;
  username: Nullable<string>;
  completedChallenges: number;
}

export type UserLeaderboardDto = LeaderboardEntryDto[];

export interface PublicUserProfile {
  username: string;
  completedChallenges: number;
  attemptedChallenges: number;
  portfolioSkillsSummary: PortfolioSkillSummaryMap;
}

export interface AdminProgressChartItem {
  userCount: number;
  progressCount: number;
}

export interface AdminProgressSeries {
  [key: string]: number;
}

export type AdminProgressChartDto = {
  userProgressDistribution: AdminProgressChartItem[];
  globalChallengeProgressSeries: AdminProgressSeries;
};

/**
 * Only these fields can be updated on the user object by the
 * POST user/profile API. This validation is applied on the server.
 */
export interface UserUpdateOptions<SettingsType = Partial<UserSettings>> {
  givenName?: string;
  familyName?: string;
  username?: string;
  avatarUrl?: string;
  optInPublicProfile?: boolean;
  optInShareAnonymousGeolocationActivity?: boolean;
  settings?: SettingsType;
}

export interface Payment {
  courseId: string;
  datePaid: Date;
  amountPaid: number;
  plan: PAYMENT_PLAN;
  status: PAYMENT_STATUS;
  paymentType: PAYMENT_TYPE;
  extraData?: string /* generic json data */;
}

export interface PaymentRequestDto {
  courseId: string;
  plan: PAYMENT_PLAN;
}

export interface AdminPurchaseCourseDto {
  userEmail: string;
  courseId: string;
  plan: PAYMENT_PLAN;
}

export interface ILastActiveIdsDto {
  courseId: string;
  challengeId: string;
}

export type PAYMENT_STATUS = "CONFIRMED" | "REFUNDED";

export type PAYMENT_TYPE = "ADMIN_GIFT" | "USER_PAID";

export type PAYMENT_PLAN = "REGULAR" | "PREMIUM";

export type COURSE_ACCESS_LEVEL = "FREE" | "PAID";

export type SSO = "google" | "github" | "facebook";

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

export interface IGenericFeedback {
  message: string;
  context: string;
}

/** ===========================================================================
 * Code Blobs for Challenges
 * ----------------------------------------------------------------------------
 * The code blob is a flexible entity which represents user specific information
 * per challenge. They differ based on the challenge type: each challenge
 * type has a specific type of code blob.
 * ============================================================================
 */

export type BLOB_TYPE =
  | "video"
  | "challenge"
  | "project"
  | "guided_project"
  | "sandbox";

export const BlobTypeSet: Set<BLOB_TYPE> = new Set([
  "video",
  "challenge",
  "project",
  "guided_project",
  "sandbox",
]);

interface BlobBase {
  type: BLOB_TYPE;
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

export interface SandboxBlob extends BlobBase {
  type: "sandbox";
  code: string;
  challengeType: CHALLENGE_TYPE;
}

export type DataBlob =
  | VideoChallengeBlob
  | ProjectChallengeBlob
  | CodeChallengeBlob
  | GuidedProjectBlob
  | SandboxBlob;

export interface ICodeBlobDto {
  dataBlob: DataBlob;
  challengeId: string;
}

// Null blob type is used to represent a code blob which does not exist
export interface NullBlob {
  dataBlob: null;
  challengeId: null;
}

export interface CodeBlobBulk {
  [key: string]: ICodeBlobDto;
}

/** ===========================================================================
 * User Progress History
 * ============================================================================
 */

/**
 * Represent all 3 states for a challenge:
 *
 * true: completed
 * false: incomplete
 * undefined: never attempted
 *
 * Also includes the time a challenge was completed. The timeCompleted
 * field will disingenuously reflect the time last attempted (not completed),
 * if the progress update was mode with complete = false.
 */
export interface ChallengeStatus {
  complete: boolean;
  timeCompleted: Date;
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

export interface ProgressEntity {
  courseId: string;
  progress: UserCourseStatus;
}

export type UserCourseProgress = ProgressEntity[];

/** ===========================================================================
 * Payment Types
 * ============================================================================
 */

export interface StripeStartCheckoutSuccessResponse {
  stripeCheckoutSessionId: string;
}

/** ===========================================================================
 * Pull Request Diff Context
 * ============================================================================
 */

export interface PullRequestDiffContext {
  id: string;
  moduleId: string;
  courseId: string;
  updatedChallenge: Challenge;
  originalChallenge: Challenge;
}

export interface PullRequestCourseContent {
  challengeIds: string[];
  courseList: CourseList;
  courseSkeletonList: CourseSkeletonList;
}

/** ===========================================================================
 * Recent Progress DTOs
 * ============================================================================
 */

export interface RecentProgressRecord {
  user: string;
  challenges: string[];
}

export interface RecentProgressPublicStats {
  totalUsersCount: number;
  completedChallengesCount: number;
}

export interface RecentProgressAdminStats {
  totalUsersCount: number;
  completedChallengesCount: number;
  moreThanThreeCount: number;
  registeredUserCount: number;
  healthRatio: number;
}

export interface RecentProgressAdminDto {
  statusMessage: string;
  stats: RecentProgressAdminStats;
  records: RecentProgressRecord[];
}

/** ===========================================================================
 * Redis & Web Socket type definitions
 * ============================================================================
 */

export type CacheUpdateMessage = {
  id: string;
  complete: boolean;
  challengeId: string;
};

export type ConnectedUsersUpdateMessage = {
  connectedClients: number;
};

// Types for various support socket-io events
export enum SocketServerEventTypes {
  REAL_TIME_CHALLENGE_UPDATE = "REAL_TIME_CHALLENGE_UPDATE",
  CONNECTED_USER_COUNT_UPDATE = "CONNECTED_USER_COUNT_UPDATE",
}

export interface RealTimeUpdateEvent {
  type: SocketServerEventTypes.REAL_TIME_CHALLENGE_UPDATE;
  payload: CacheUpdateMessage;
}

export interface ConnectedUsersUpdateEvent {
  type: SocketServerEventTypes.CONNECTED_USER_COUNT_UPDATE;
  payload: ConnectedUsersUpdateMessage;
}

// All socket-io server sent events
export type SocketServerEvents =
  | RealTimeUpdateEvent
  | ConnectedUsersUpdateEvent;

export enum SocketClientEventTypes {
  WORKSPACE_CLIENT_CONNECTED = "WORKSPACE_CLIENT_CONNECTED",
}

export interface WorkspaceClientConnectedEvent {
  type: SocketClientEventTypes.WORKSPACE_CLIENT_CONNECTED;
}

// All client sent socket-io events
export type SocketClientEvents = WorkspaceClientConnectedEvent;
