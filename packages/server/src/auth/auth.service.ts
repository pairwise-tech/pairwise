import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { JwtPassportSignPayload } from "./strategies/jwt.strategy";
import { FacebookProfileWithCredentials } from "./strategies/facebook.strategy";
import { GitHubProfileWithCredentials } from "./strategies/github.strategy";
import { GoogleProfileWithCredentials } from "./strategies/google.strategy";
import { GenericUserProfile, UserService } from "src/user/user.service";
import { UserProfile, Ok, Err, Result } from "@pairwise/common";
import { ERROR_CODES } from "src/tools/constants";
import {
  captureSentryException,
  captureSentryMessage,
} from "src/tools/sentry-utils";

export type Strategy = "GitHub" | "Facebook" | "Google";

export type LoginFailureCodes =
  | ERROR_CODES.SSO_EMAIL_NOT_FOUND
  | ERROR_CODES.UNKNOWN_LOGIN_ERROR;

interface LoginSuccess {
  token: string;
  accountCreated: boolean;
}

type LoginServiceReturnType = Promise<Result<LoginSuccess, LoginFailureCodes>>;

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  public async handleEmailLoginRequest(email: string) {
    /**
     * This will need to send an email to the provided email address with
     * a link to signin to the app. That link will go to the Workspace with
     * an access token which will create/login a user by the email address
     * they provided.
     */
    console.log(`Received request to login by email: ${email}`);
  }

  public async handleFacebookSignin(
    requestProfile: FacebookProfileWithCredentials,
  ) {
    try {
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

      if (!email) {
        return this.handleEmailNotFound("Facebook");
      }

      const { user, accountCreated } = await this.userService.findOrCreateUser(
        userProfile,
      );
      const token = this.getJwtAccessToken(user.profile);
      return new Ok({ token, accountCreated });
    } catch (err) {
      captureSentryException(err);
      return new Err(ERROR_CODES.UNKNOWN_LOGIN_ERROR);
    }
  }

  public async handleGitHubSignin(
    requestProfile: GitHubProfileWithCredentials,
  ): LoginServiceReturnType {
    try {
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

      console.log(
        `Authenticating user {email: ${email}} using GitHub Strategy`,
      );

      if (!email) {
        return this.handleEmailNotFound("GitHub");
      }

      const { user, accountCreated } = await this.userService.findOrCreateUser(
        userProfile,
      );
      const token = this.getJwtAccessToken(user.profile);
      return new Ok({ token, accountCreated });
    } catch (err) {
      captureSentryException(err);
      return new Err(ERROR_CODES.UNKNOWN_LOGIN_ERROR);
    }
  }

  public async handleGoogleSignin(
    requestProfile: GoogleProfileWithCredentials,
  ): LoginServiceReturnType {
    try {
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

      console.log(
        `Authenticating user {email: ${email}} using Google Strategy`,
      );

      if (!email) {
        return this.handleEmailNotFound("Google");
      }

      const { user, accountCreated } = await this.userService.findOrCreateUser(
        userProfile,
      );
      const token = this.getJwtAccessToken(user.profile);
      return new Ok({ token, accountCreated });
    } catch (err) {
      captureSentryException(err);
      return new Err(ERROR_CODES.UNKNOWN_LOGIN_ERROR);
    }
  }

  private getJwtAccessToken(user: UserProfile) {
    const payload: JwtPassportSignPayload = {
      email: user.email,
      sub: user.uuid,
    };

    return this.jwtService.sign(payload);
  }

  private handleEmailNotFound(
    strategy: Strategy,
  ): Err<ERROR_CODES.SSO_EMAIL_NOT_FOUND> {
    // we need email to proceed, fail if not found. Report this to Sentry
    // so we get a general idea of the incidence rate at which this occurs
    captureSentryMessage(`${ERROR_CODES.SSO_EMAIL_NOT_FOUND}: ${strategy}`);
    return new Err(ERROR_CODES.SSO_EMAIL_NOT_FOUND);
  }
}
