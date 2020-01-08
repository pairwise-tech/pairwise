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
  profileImageUrl?: string;
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

  async findUserByEmailAndReturnProfile(email: string) {
    const user = await this.userRepository.findOne({ email });

    const payments = await this.paymentsRepository.find({
      where: {
        user,
      },
    });

    const result: IUserDto = {
      payments,
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
      console.log(`Updating user: ${user.email}`);
      const { uuid, email } = user;
      await this.userRepository.update({ uuid }, validationResult.value);
      return await this.findUserByEmail(email);
    }
  }
}
