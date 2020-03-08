import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { JwtPassportSignPayload } from "./strategies/jwt.strategy";
import { FacebookProfileWithCredentials } from "./strategies/facebook.strategy";
import { GitHubProfileWithCredentials } from "./strategies/github.strategy";
import { GoogleProfileWithCredentials } from "./strategies/google.strategy";
import { GenericUserProfile, UserService } from "src/user/user.service";
import { UserProfile } from "@pairwise/common";
import { ERROR_CODES } from "src/tools/constants";

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  public async handleFacebookSignin(
    requestProfile: FacebookProfileWithCredentials,
  ) {
    const profile = requestProfile.profile._json;
    const email = profile.email;
    const avatarUrl = profile.picture.data.url;
    const { first_name, last_name } = profile;
    const name = `${first_name} ${last_name}`;
    const userProfile: GenericUserProfile = {
      email,
      avatarUrl,
      displayName: name,
      givenName: first_name,
      familyName: last_name,
    };

    console.log(
      `Authenticating user {email: ${email}} using Facebook Strategy`,
    );

    /** we need user's email, make sure its there! */
    this.throwIfEmailIsNull(email);

    const { user, accountCreated } = await this.userService.findOrCreateUser(
      userProfile,
    );
    const token = this.getJwtAccessToken(user.profile);
    return { token, accountCreated };
  }

  public async handleGitHubSignin(
    requestProfile: GitHubProfileWithCredentials,
  ) {
    const profile = requestProfile.profile._json;

    const email = profile.email;
    const avatarUrl = profile.avatar_url;

    /* Whatever! */
    const [firstName = "", lastName = ""] = profile.name.split(" ");
    const userProfile: GenericUserProfile = {
      email,
      avatarUrl,
      givenName: firstName,
      familyName: lastName,
      displayName: profile.name,
    };

    console.log(`Authenticating user {email: ${email}} using GitHub Strategy`);

    /** we need user's email, make sure its there! */
    this.throwIfEmailIsNull(email);

    const { user, accountCreated } = await this.userService.findOrCreateUser(
      userProfile,
    );
    const token = this.getJwtAccessToken(user.profile);
    return { token, accountCreated };
  }

  public async handleGoogleSignin(
    requestProfile: GoogleProfileWithCredentials,
  ) {
    const profile = requestProfile.profile._json;
    const email = profile.email;
    const avatarUrl = profile.picture;
    const userProfile: GenericUserProfile = {
      email,
      avatarUrl,
      displayName: profile.name,
      givenName: profile.given_name,
      familyName: profile.family_name,
    };

    console.log(`Authenticating user {email: ${email}} using Google Strategy`);

    /** we need user's email, make sure its there! */
    this.throwIfEmailIsNull(email);

    const { user, accountCreated } = await this.userService.findOrCreateUser(
      userProfile,
    );
    const token = this.getJwtAccessToken(user.profile);
    return { token, accountCreated };
  }

  private getJwtAccessToken(user: UserProfile) {
    const payload: JwtPassportSignPayload = {
      email: user.email,
      sub: user.uuid,
    };

    return this.jwtService.sign(payload);
  }

  /**
   * Check to ensure the email we pull out of the SSO account's profile is
   * not null or empty. If it is, throw an error that we catch in the auth
   * controller so we can respond appropriately to the client.
   */
  private throwIfEmailIsNull(email: string) {
    if (!email) {
      throw new Error(ERROR_CODES.SSO_EMAIL_NOT_FOUND);
    }
  }
}
