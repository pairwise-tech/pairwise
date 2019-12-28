import { Injectable } from "@nestjs/common";
import { User } from "./user.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";

export interface GenericUserProfile {
  email: string;
  displayName: string;
  givenName: string;
  familyName: string;
}

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findUserByEmail(email: string) {
    const user = await this.userRepository.findOne({ email });
    return user;
  }

  async findOrCreateUser(profile: GenericUserProfile) {
    /**
     * TODO: For multiple SSO providers, check and consolidate login
     * attempts by email address. A single email address is associated
     * with only one user, regardless of which provider a user logins in
     * with.
     */
    const { email } = profile;
    console.log(`Running findOrCreateUser for email ${email}`);
    const userExists = await this.findUserByEmail(email);
    if (userExists) {
      console.log("User exists, returning.");
      return userExists;
    } else {
      console.log("Creating new user.");
      const userData = {
        email,
        givenName: profile.givenName,
        familyName: profile.familyName,
        displayName: profile.displayName,
      };
      await this.userRepository.insert(userData);
      return this.findUserByEmail(email);
    }
  }
}
