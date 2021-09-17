import { Injectable, BadRequestException } from "@nestjs/common";
import { User } from "./user.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { Payments } from "../payments/payments.entity";
import {
  IUserDto,
  UserUpdateOptions,
  UserSettings,
  UserProgressMap,
  defaultUserSettings,
  UserProfile,
  ILastActiveIdsDto,
  SSO,
  UserLeaderboardDto,
  assertUnreachable,
} from "@pairwise/common";
import { RequestUser } from "../types";
import {
  validateUserUpdateDetails,
  validateLastActiveChallengeIdsPayload,
  validateDisconnectAccountRequest,
} from "../tools/validation-utils";
import { ProgressService } from "../progress/progress.service";
import { ERROR_CODES, SUCCESS_CODES } from "../tools/constants";
import { SlackService, slackService } from "../slack/slack.service";
import { SigninStrategy } from "../auth/auth.service";
import { EmailService, emailService } from "../email/email.service";
import shortid from "shortid";

export interface GenericUserProfile {
  email: string;
  emailVerified: boolean;
  displayName: string;
  givenName: string;
  familyName: string;
  avatarUrl: string;
  facebookAccountId: string | null;
  githubAccountId: string | null;
  googleAccountId: string | null;
}

export interface SSOAccountsIds {
  facebookAccountId?: string;
  githubAccountId?: string;
  googleAccountId?: string;
}

@Injectable()
export class UserService {
  private readonly slackService: SlackService = slackService;
  private readonly emailService: EmailService = emailService;

  constructor(
    private readonly progressService: ProgressService,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Payments)
    private readonly paymentsRepository: Repository<Payments>,
  ) {}

  // Return one user for the admin API
  public async adminGetUser(emailString: string) {
    const email = this.standardizeEmail(emailString);
    return this.findUserByEmailGetFullProfile(email);
  }

  // Return all users and join with payments.
  // NOTE: This does not handle pagination. But that's probably not a
  // problem until we have 10_000s of users. Ha!
  public async adminGetAllUsers() {
    const users = await this.userRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.payments", "payments")
      .leftJoinAndSelect("user.challengeProgressHistory", "progress")
      .getMany();

    return users.map((rawUser) => {
      // Parse raw JSON string challenge progress histories
      // @ts-ignore
      const progress = rawUser.challengeProgressHistory.map((history) => {
        return {
          ...history,
          progress: JSON.parse(history.progress),
        };
      });
      return {
        ...rawUser,
        challengeProgressHistory: progress,
      };
    });
  }

  /**
   * Compute user leaderboard rankings, for a given user.
   */
  public async getUserLeaderboard(
    userProfile: UserProfile,
  ): Promise<UserLeaderboardDto> {
    const users = await this.userRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.challengeProgressHistory", "progress")
      .getMany();

    const result = users
      .map((x) => {
        const ts = x.challengeProgressHistory.find(
          (progress) => progress.courseId === "fpvPtfu7s",
        );

        const completedChallenges = ts
          ? Object.keys(JSON.parse(ts.progress)).length
          : 0;

        return {
          isUser: x.uuid === userProfile.uuid,
          updatedAt: x.updatedAt,
          completedChallenges,
        };
      })
      .filter((x) => x.completedChallenges > 0)
      .sort((a, b) => {
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      })
      .sort((a, b) => {
        return b.completedChallenges - a.completedChallenges;
      })
      .map((x) => {
        const { completedChallenges, isUser } = x;
        return { completedChallenges, isUser };
      });

    return result;
  }

  public async adminDeleteUserByEmail(email: string) {
    const user = await this.findUserByEmail(email);

    if (!user) {
      throw new BadRequestException(ERROR_CODES.MISSING_USER);
    }

    await this.userRepository.delete({
      uuid: user.profile.uuid,
    });

    return SUCCESS_CODES.OK;
  }

  public async adminDeleteUserByUuid(uuid: string) {
    await this.userRepository.delete({ uuid });
    return SUCCESS_CODES.OK;
  }

  public async deleteUserAccount(profile: UserProfile) {
    const { uuid, email } = profile;
    await this.userRepository.delete({ uuid });
    console.warn(
      `[DELETE ACCOUNT]: User account deleted successfully for user uuid: ${uuid}, email: ${email}`,
    );

    await this.slackService.postUserAccountDeletionMessage(uuid, email);
    return SUCCESS_CODES.OK;
  }

  public async findUserByEmail(emailString: string) {
    const email = this.standardizeEmail(emailString);
    const user = await this.userRepository.findOne({ email });
    return this.processUserEntity(user);
  }

  public async findByFacebookProfileId(facebookAccountId: string) {
    const user = await this.userRepository.findOne({ facebookAccountId });
    return this.processUserEntity(user);
  }

  public async findByGithubProfileId(githubAccountId: string) {
    const user = await this.userRepository.findOne({ githubAccountId });
    return this.processUserEntity(user);
  }

  public async findByGoogleProfileId(googleAccountId: string) {
    const user = await this.userRepository.findOne({ googleAccountId });
    return this.processUserEntity(user);
  }

  public async updateFacebookAccountId(
    userProfile: UserProfile,
    facebookAccountId: string | null,
  ) {
    const { uuid } = userProfile;
    await this.userRepository.update({ uuid }, { facebookAccountId });
    return await this.findUserByUuidGetFullProfile(uuid);
  }

  public async updateGithubAccountId(
    userProfile: UserProfile,
    githubAccountId: string | null,
  ) {
    const { uuid } = userProfile;
    await this.userRepository.update({ uuid }, { githubAccountId });
    return await this.findUserByUuidGetFullProfile(uuid);
  }

  public async updateGoogleAccountId(
    userProfile: UserProfile,
    googleAccountId: string | null,
  ) {
    const { uuid } = userProfile;
    await this.userRepository.update({ uuid }, { googleAccountId });
    return await this.findUserByUuidGetFullProfile(uuid);
  }

  public async markEmailAsVerified(uuid: string) {
    await this.userRepository.update({ uuid }, { emailVerified: true });
  }

  public async grantCoachingSessionToUser(uuid: string, sessions: number) {
    console.log(`Granting coaching session to user, uuid: ${uuid}`);
    await this.userRepository.update({ uuid }, { coachingSessions: sessions });
    return SUCCESS_CODES.OK;
  }

  public async markCoachingSessionAsCompleteForUser(uuid: string) {
    console.log(`Revoking coaching session for user, uuid: ${uuid}`);
    const user = await this.findUserByUuidGetFullProfile(uuid);
    const { coachingSessions } = user.profile;

    // Reduce by 1, don't go negative
    const sessions = coachingSessions > 0 ? coachingSessions - 1 : 0;
    await this.userRepository.update({ uuid }, { coachingSessions: sessions });
    return SUCCESS_CODES.OK;
  }

  /**
   * Handle setting a connected user SSO account id back to null to
   * disconnect that account.2
   *
   * TODO: Add e2e tests.
   */
  public async handleDisconnectAccount(userProfile: UserProfile, sso: SSO) {
    // Validate the request first
    validateDisconnectAccountRequest(userProfile);

    switch (sso) {
      case "google": {
        return this.updateGoogleAccountId(userProfile, null);
      }
      case "facebook": {
        return this.updateFacebookAccountId(userProfile, null);
      }
      case "github": {
        return this.updateGithubAccountId(userProfile, null);
      }
      default: {
        assertUnreachable(sso);
      }
    }
  }

  /**
   * This is the method which aggregates various pieces of data to add to the
   * user profile in order to construct a single object which consolidates
   * all of this information in one place. This is mainly just a convenience
   * to make it easier to access these relevant pieces of data in various
   * places.
   *
   * One minor downside of this is that this combined user object is fetched
   * and attached to the request for every authenticated API request which
   * does require more database requests to fetch everything.
   */
  public async findUserByUuidGetFullProfile(uuid: string) {
    const user = await this.userRepository.findOne({ uuid });

    if (!user) {
      throw new BadRequestException(ERROR_CODES.MISSING_USER);
    }

    return this.fillUserProfile(user);
  }

  /**
   * NOTE: Be careful using this method! Not all users will have an
   * email address! This is currently used only by the Admin Service
   * to perform Admin actions.
   */
  public async findUserByEmailGetFullProfile(emailString: string) {
    const email = this.standardizeEmail(emailString);
    const user = await this.userRepository.findOne({ email });

    if (!user) {
      throw new BadRequestException(ERROR_CODES.MISSING_USER);
    }

    return this.fillUserProfile(user);
  }

  private async fillUserProfile(user: User) {
    const { payments, courses } = await this.getCourseForUser(user);
    const { progress } = await this.getProgressMapForUser(user);
    const { profile, settings, lastActiveChallengeIds } =
      this.processUserEntity(user);

    const result: IUserDto = {
      profile,
      payments,
      courses,
      settings,
      progress,
      lastActiveChallengeIds,
    };

    return result;
  }

  public async createNewUser(
    profile: GenericUserProfile,
    signinStrategy: SigninStrategy,
  ) {
    // Standardize profile email if it exists
    const email = profile.email
      ? this.standardizeEmail(profile.email)
      : undefined;

    const result = await this.userRepository.insert({
      ...profile,
      email,
      settings: JSON.stringify({}),
      lastActiveChallengeIds: JSON.stringify({}),
    });

    // Look up the newly created user with the uuid from the insertion result
    const { uuid } = result.identifiers[0];
    const user = await this.findUserByUuidGetFullProfile(uuid);

    this.slackService.postUserAccountCreationMessage({
      profile,
      accountCreated: true,
      signinStrategy,
    });

    // Send Welcome email, if the user has an email address
    if (email) {
      this.emailService.sendWelcomeEmail(email);
    }

    return user;
  }

  public async updateUserEmail(email: string, uuid: string) {
    const userWithEmail = await this.findUserByEmail(email);

    // Check if  the email is taken
    if (userWithEmail && userWithEmail.profile.uuid !== uuid) {
      throw new BadRequestException(ERROR_CODES.EMAIL_TAKEN);
    } else {
      // Find the user to verify the uuid is valid
      await this.findUserByUuidGetFullProfile(uuid);

      // All good - update the email on this user
      await this.userRepository.update({ uuid }, { email });
    }
  }

  public async updateUser(user: RequestUser, userDetails: UserUpdateOptions) {
    const validationResult = validateUserUpdateDetails(user, userDetails);

    if (validationResult.error) {
      throw new BadRequestException(validationResult.error);
    } else {
      const { uuid } = user.profile;
      await this.userRepository.update({ uuid }, validationResult.value);
      return await this.findUserByUuidGetFullProfile(uuid);
    }
  }

  public async updateLastActiveChallengeIds(
    user: RequestUser,
    lastActiveIds: ILastActiveIdsDto,
  ) {
    try {
      // Validate the request payload
      if (!validateLastActiveChallengeIdsPayload(lastActiveIds)) {
        throw new Error("Invalid payload");
      }

      const { courseId, challengeId } = lastActiveIds;
      const { lastActiveChallengeIds } = user;

      const updatedActiveIds = {
        ...lastActiveChallengeIds,
        [courseId]: challengeId,
        lastActiveChallenge: challengeId,
      };

      await this.userRepository.update(
        { uuid: user.profile.uuid },
        { lastActiveChallengeIds: JSON.stringify(updatedActiveIds) },
      );

      return updatedActiveIds;
    } catch (err) {
      console.error(
        `Failed to update lastActiveChallengeIds for payload: ${JSON.stringify(
          lastActiveIds,
        )}, error message: ${err.message}`,
      );
      throw new BadRequestException(ERROR_CODES.OPERATION_FAILED);
    }
  }

  /**
   * A helper method which processes the database user entity and is
   * responsible for deserializing and populating the user settings object.
   *
   * This is where the default user settings are merged against whatever
   * user settings the user already has, which ensures the format of the
   * user settings object is always consistent regardless of the previous
   * state it was in.
   */
  private processUserEntity = (user: User) => {
    if (user) {
      const deserializedSettings = JSON.parse(user.settings);
      const settings: UserSettings = {
        ...defaultUserSettings,
        ...deserializedSettings,
      };

      const deserializedActiveIds = JSON.parse(user.lastActiveChallengeIds);

      const result = {
        settings,
        profile: user,
        lastActiveChallengeIds: deserializedActiveIds,
      };

      return result;
    }
  };

  private async getCourseForUser(user: User) {
    const payments = await this.paymentsRepository.find({
      where: {
        user,
      },
    });

    const courses = payments.reduce((courseAccess, { courseId, status }) => {
      const courseIsPaid = status === "CONFIRMED";
      return {
        ...courseAccess,
        [courseId]: courseIsPaid,
      };
    }, {});

    return { payments, courses };
  }

  private async getProgressMapForUser(user: User) {
    const progressList = await this.progressService.fetchUserProgress(
      user.uuid,
    );

    const progress: UserProgressMap = progressList.reduce(
      (map, courseProgress) => {
        const history = JSON.parse(courseProgress.progress);
        return {
          ...map,
          [courseProgress.courseId]: history,
        };
      },
      {},
    );

    return { progress };
  }

  // Standardize emails to lower case to avoid duplicates based on
  // inconsistent casing
  private standardizeEmail(emailString) {
    return emailString.toLowerCase();
  }
}
