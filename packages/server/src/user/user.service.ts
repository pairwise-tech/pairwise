import { Injectable, BadRequestException } from "@nestjs/common";
import { User } from "./user.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { Payments } from "src/payments/payments.entity";
import { IUserDto, UserUpdateOptions } from "@pairwise/common";
import { RequestUser } from "src/types";
import { validateUserUpdateDetails } from "src/tools/validation";

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
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Payments)
    private readonly paymentsRepository: Repository<Payments>,
  ) {}

  async findUserByEmail(email: string) {
    return this.userRepository.findOne({ email });
  }

  async findUserByEmailGetFullProfile(email: string) {
    const user = await this.userRepository.findOne({ email });

    const payments = await this.paymentsRepository.find({
      where: {
        user,
      },
    });

    const courses = payments.reduce((courseAccess, { courseId, type }) => {
      return {
        ...courseAccess,
        [courseId]: type === "SUCCESS" ? true : false,
      };
    }, {});

    const result: IUserDto = {
      payments,
      courses,
      profile: user,
    };

    return result;
  }

  async findOrCreateUser(profile: GenericUserProfile) {
    const { email } = profile;
    let accountCreated: boolean;

    let user = await this.findUserByEmail(email);
    if (user) {
      accountCreated = false;
    } else {
      accountCreated = true;
      await this.userRepository.insert(profile);
      user = await this.findUserByEmail(email);
    }

    const msg = accountCreated ? "New account created" : "Account login";
    console.log(`${msg} for email: ${email}`);

    return { user, accountCreated };
  }

  async updateUser(user: RequestUser, userDetails: UserUpdateOptions) {
    const validationResult = validateUserUpdateDetails(userDetails);

    if (validationResult.error) {
      throw new BadRequestException(validationResult.error);
    } else {
      const { uuid, email } = user.profile;
      console.log(`Updating user: ${email}`);

      await this.userRepository.update({ uuid }, validationResult.value);
      return await this.findUserByEmailGetFullProfile(email);
    }
  }

  async updateLastActiveChallengeId(user: RequestUser, challengeId: string) {
    await this.userRepository.update(
      { uuid: user.profile.uuid },
      { lastActiveChallengeId: challengeId },
    );
  }
}
