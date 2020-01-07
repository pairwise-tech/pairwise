import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { User } from "src/user/user.entity";
import { JwtPassportSignPayload } from "./strategies/jwt.strategy";
import { FacebookProfileWithCredentials } from "./strategies/facebook.strategy";
import { GitHubProfileWithCredentials } from "./strategies/github.strategy";
import { GoogleProfileWithCredentials } from "./strategies/google.strategy";
import { GenericUserProfile, UserService } from "src/user/user.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  async handleFacebookSignin(user: FacebookProfileWithCredentials) {
    const profile = user.profile._json;
    const email = profile.email;
    const profileImageUrl = profile.picture.data.url;
    const { first_name, last_name } = profile;
    const name = `${first_name} ${last_name}`;
    const userProfile: GenericUserProfile = {
      email,
      profileImageUrl,
      displayName: name,
      givenName: first_name,
      familyName: last_name,
    };

    console.log(
      `Authenticating user {email: ${email}} using Facebook Strategy`,
    );
    const account = await this.userService.findOrCreateUser(userProfile);
    return this.getJwtAccessToken(account);
  }

  async handleGitHubSignin(user: GitHubProfileWithCredentials) {
    const profile = user.profile._json;

    const email = profile.email;
    const profileImageUrl = profile.avatar_url;

    /* Whatever! */
    const [firstName = "", lastName = ""] = profile.name.split(" ");
    const userProfile: GenericUserProfile = {
      email,
      profileImageUrl,
      givenName: firstName,
      familyName: lastName,
      displayName: profile.name,
    };

    console.log(`Authenticating user {email: ${email}} using GitHub Strategy`);
    const account = await this.userService.findOrCreateUser(userProfile);
    return this.getJwtAccessToken(account);
  }

  async handleGoogleSignin(user: GoogleProfileWithCredentials) {
    const profile = user.profile._json;
    const email = profile.email;
    const profileImageUrl = profile.picture;
    const userProfile: GenericUserProfile = {
      email,
      profileImageUrl,
      displayName: profile.name,
      givenName: profile.given_name,
      familyName: profile.family_name,
    };

    console.log(`Authenticating user {email: ${email}} using Google Strategy`);
    const account = await this.userService.findOrCreateUser(userProfile);
    return this.getJwtAccessToken(account);
  }

  getJwtAccessToken(user: User) {
    const payload: JwtPassportSignPayload = {
      email: user.email,
      sub: user.uuid,
    };

    return this.jwtService.sign(payload);
  }
}
