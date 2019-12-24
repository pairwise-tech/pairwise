import { Injectable } from "@nestjs/common";
import { User } from "./user.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { FacebookProfile } from "src/auth/facebook.strategy";

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findOrCreateUser(profile: FacebookProfile) {
    /**
     * TODO: For multiple SSO providers, check and consolidate login
     * attempts by email address. A single email address is associated
     * with only one user, regardless of which provider a user logins in
     * with.
     */
    console.log("Handling findOrCreateUser for profile:");
    console.log(profile);

    const email = profile.emails[0].value;
    const userExists = await this.userRepository.findOne({ email });
    if (userExists) {
      console.log("User exists.");
      return userExists;
    } else {
      console.log("User does not exist, creating:");
      const userData = {
        email,
        displayName: profile.displayName,
        givenName: profile.name.givenName,
        familyName: profile.name.familyName,
      };
      await this.userRepository.insert(userData);
      return this.userRepository.findOne({ email });
    }
  }
}
