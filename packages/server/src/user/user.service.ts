import { Injectable, BadRequestException } from "@nestjs/common";
import { User } from "./user.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { Payments } from "src/payments/payments.entity";
import {
  IUserDto,
  UserUpdateOptions,
  UserSettings,
  UserProgressMap,
  defaultUserSettings,
  UserProfile,
  ILastActiveIdsDto,
} from "@pairwise/common";
import { RequestUser } from "src/types";
import {
  validateUserUpdateDetails,
  validateEmailUpdateRequest,
  validateLastActiveChallengeIdsPayload,
} from "src/tools/validation";
import { ProgressService } from "src/progress/progress.service";
import { ERROR_CODES, SUCCESS_CODES } from "src/tools/constants";
import { SlackService, slackService } from "src/slack/slack.service";
import { SigninStrategy } from "src/auth/auth.service";
import { EmailService, emailService } from "src/email/email.service";

export interface GenericUserProfile {
  email: string;
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

  public async adminGetAllUsers() {
    // Return all users and join with payments.
    // NOTE: This does not handle pagination. But that's probably not a
    // problem until we have 10_000s of users. Ha!
    return this.userRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.challengeProgressHistory", "progress")
      .getMany();
  }

  public async adminDeleteUserByUuid(uuid: string) {
    const user = await this.findUserByUuidGetFullProfile(uuid);

    if (!user) {
      throw new BadRequestException(ERROR_CODES.MISSING_USER);
    }

    await this.userRepository.delete({
      uuid: user.profile.uuid,
    });

    return SUCCESS_CODES.OK;
  }

  public async findUserByEmail(email: string) {
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
    facebookAccountId: string,
  ) {
    const { uuid } = userProfile;
    await this.userRepository.update({ uuid }, { facebookAccountId });
    return await this.findUserByUuidGetFullProfile(uuid);
  }

  public async updateGithubAccountId(
    userProfile: UserProfile,
    githubAccountId: string,
  ) {
    const { uuid } = userProfile;
    await this.userRepository.update({ uuid }, { githubAccountId });
    return await this.findUserByUuidGetFullProfile(uuid);
  }

  public async updateGoogleAccountId(
    userProfile: UserProfile,
    googleAccountId: string,
  ) {
    const { uuid } = userProfile;
    await this.userRepository.update({ uuid }, { googleAccountId });
    return await this.findUserByUuidGetFullProfile(uuid);
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
  public async findUserByEmailGetFullProfile(email: string) {
    const user = await this.userRepository.findOne({ email });

    if (!user) {
      throw new BadRequestException(ERROR_CODES.MISSING_USER);
    }

    return this.fillUserProfile(user);
  }

  private async fillUserProfile(user: User) {
    const { payments, courses } = await this.getCourseForUser(user);
    const { progress } = await this.getProgressMapForUser(user);
    const {
      profile,
      settings,
      lastActiveChallengeIds,
    } = this.processUserEntity(user);

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
    const result = await this.userRepository.insert({
      ...profile,
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
    if (profile.email) {
      this.emailService.sendWelcomeEmail(profile.email);
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
      const updated = {
        ...lastActiveChallengeIds,
        [courseId]: challengeId,
      };

      await this.userRepository.update(
        { uuid: user.profile.uuid },
        { lastActiveChallengeIds: JSON.stringify(updated) },
      );
      console.log(`\n- UPDATED! ${courseId} - ${challengeId}\n`);
    } catch (err) {
      console.log(
        `[ERROR]: Failed to update lastActiveChallengeIds for payload: ${JSON.stringify(
          lastActiveIds,
        )}`,
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
}
