import { Injectable, BadRequestException } from "@nestjs/common";
import { User } from "./user.entity";
import { Repository, createQueryBuilder } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { Payments } from "src/payments/payments.entity";
import {
  IUserDto,
  UserUpdateOptions,
  UserSettings,
  UserProgressMap,
  defaultUserSettings,
} from "@pairwise/common";
import { RequestUser } from "src/types";
import { validateUserUpdateDetails } from "src/tools/validation";
import { ProgressService } from "src/progress/progress.service";
import { ERROR_CODES } from "src/tools/constants";
import { SlackService } from "src/slack/slack.service";

export interface GenericUserProfile {
  email: string;
  displayName: string;
  givenName: string;
  familyName: string;
  avatarUrl: string;
}

@Injectable()
export class UserService {
  constructor(
    private readonly progressService: ProgressService,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Payments)
    private readonly paymentsRepository: Repository<Payments>,

    private readonly slackService: SlackService,
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

  public async findUserByEmail(email: string) {
    const user = await this.userRepository.findOne({ email });
    return this.processUserEntity(user);
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

  public async findOrCreateUser(profile: GenericUserProfile) {
    const { email } = profile;
    let accountCreated: boolean;

    let user = await this.findUserByEmail(email);
    if (user) {
      accountCreated = false;
    } else {
      accountCreated = true;
      await this.userRepository.insert({
        ...profile,
        lastActiveChallengeId: "",
        settings: JSON.stringify({}),
      });
      user = await this.findUserByEmail(email);
    }

    const msg = accountCreated ? "New account created" : "Account login";
    console.log(`${msg} for email: ${email}`);

    this.slackService.postUserAccountCreationMessage({
      profile,
      accountCreated,
    });
    return { user, accountCreated };
  }

  public async updateUser(user: RequestUser, userDetails: UserUpdateOptions) {
    const validationResult = validateUserUpdateDetails(user, userDetails);

    if (validationResult.error) {
      throw new BadRequestException(validationResult.error);
    } else {
      const { uuid, email } = user.profile;
      console.log(`Updating user: ${email}`);

      await this.userRepository.update({ uuid }, validationResult.value);
      return await this.findUserByEmailGetFullProfile(email);
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

    const progressMap: UserProgressMap = progressList.reduce(
      (map, progress) => {
        return {
          ...map,
          [progress.courseId]: progress.progress,
        };
      },
      {},
    );

    return { progress: progressMap };
  }
}
