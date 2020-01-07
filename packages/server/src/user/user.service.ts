import { Injectable } from "@nestjs/common";
import { User } from "./user.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { Payments } from "src/payments/payments.entity";
import { IUserDto } from "@pairwise/common";

export interface GenericUserProfile {
  email: string;
  displayName: string;
  givenName: string;
  familyName: string;
  profileImageUrl: string;
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
    /**
     * TODO: For multiple SSO providers, check and consolidate login
     * attempts by email address. A single email address is associated
     * with only one user, regardless of which provider a user logins in
     * with.
     */
    const { email } = profile;
    const userExists = await this.findUserByEmail(email);
    if (userExists) {
      console.log(`User exists, returning profile for ${email}`);
      return userExists;
    } else {
      console.log(`Creating new user: ${email}`);
      await this.userRepository.insert(profile);
      return this.findUserByEmail(email);
    }
  }
}
