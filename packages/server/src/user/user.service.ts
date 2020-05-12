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
} from "@pairwise/common";
import { RequestUser } from "src/types";
import { validateUserUpdateDetails } from "src/tools/validation";
import { ProgressService } from "src/progress/progress.service";
import { ERROR_CODES, SUCCESS_CODES } from "src/tools/constants";
import { SlackService, slackService } from "src/slack/slack.service";
import { SigninStrategy } from "src/auth/auth.service";

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
      .leftJoinAndSelect("user.payments", "payments")
      .getMany();
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
    const { uuid, email } = userProfile;
    await this.userRepository.update({ uuid }, { facebookAccountId });
    return await this.findUserByEmailGetFullProfile(email);
  }

  public async updateGithubAccountId(
    userProfile: UserProfile,
    githubAccountId: string,
  ) {
    const { uuid, email } = userProfile;
    await this.userRepository.update({ uuid }, { githubAccountId });
    return await this.findUserByEmailGetFullProfile(email);
  }

  public async updateGoogleAccountId(
    userProfile: UserProfile,
    googleAccountId: string,
  ) {
    const { uuid, email } = userProfile;
    await this.userRepository.update({ uuid }, { googleAccountId });
    return await this.findUserByEmailGetFullProfile(email);
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
  public async findUserByEmailGetFullProfile(email: string) {
    const user = await this.userRepository.findOne({ email });

    if (!user) {
      throw new BadRequestException(ERROR_CODES.MISSING_USER);
    }

    return this.fillUserProfile(user);
  }

  public async findUserByUuidGetFullProfile(uuid: string) {
    const user = await this.userRepository.findOne({ uuid });

    if (!user) {
      throw new BadRequestException(ERROR_CODES.MISSING_USER);
    }

    return this.fillUserProfile(user);
  }

  private async fillUserProfile(user: User) {
    const { payments, courses } = await this.getCourseForUser(user);
    const { progress } = await this.getProgressMapForUser(user);
    const { profile, settings } = this.processUserEntity(user);

    const result: IUserDto = {
      profile,
      payments,
      courses,
      settings,
      progress,
    };

    return result;
  }

  public async createNewUser(
    profile: GenericUserProfile,
    signinStrategy: SigninStrategy,
  ) {
    const result = await this.userRepository.insert({
      ...profile,
      lastActiveChallengeId: "",
      settings: JSON.stringify({}),
    });

    // Look up the newly created user with the uuid from the insertion result
    const { uuid } = result.identifiers[0];
    const user = await this.findUserByUuidGetFullProfile(uuid);

    this.slackService.postUserAccountCreationMessage({
      profile,
      accountCreated: true,
      signinStrategy,
    });

    return user;
  }

  public async updateUser(user: RequestUser, userDetails: UserUpdateOptions) {
    const validationResult = validateUserUpdateDetails(user, userDetails);

    if (validationResult.error) {
      throw new BadRequestException(validationResult.error);
    } else {
      const { uuid, email } = user.profile;

      const updateEmail = validationResult.value.email;
      // If the user is updating their email
      if (updateEmail) {
        // Find other users with the same email
        const userWithEmail = await this.findUserByEmail(updateEmail);
        // If other users exists, and have a different uuid, reject it!
        if (userWithEmail && userWithEmail.profile.uuid !== user.profile.uuid) {
          throw new BadRequestException("This email is already taken.");
        }
      }

      await this.userRepository.update({ uuid }, validationResult.value);
      return await this.findUserByEmailGetFullProfile(updateEmail || email);
    }
  }

  public async updateLastActiveChallengeId(
    user: RequestUser,
    challengeId: string,
  ) {
    await this.userRepository.update(
      { uuid: user.profile.uuid },
      { lastActiveChallengeId: challengeId },
    );
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

      const result = {
        settings,
        profile: user,
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
