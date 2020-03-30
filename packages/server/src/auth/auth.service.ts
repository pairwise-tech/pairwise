import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { JwtPassportSignPayload } from "./strategies/jwt.strategy";
import { FacebookProfileWithCredentials } from "./strategies/facebook.strategy";
import { GitHubProfileWithCredentials } from "./strategies/github.strategy";
import { GoogleProfileWithCredentials } from "./strategies/google.strategy";
import { GenericUserProfile, UserService } from "src/user/user.service";
import { UserProfile, Ok, Err, Result } from "@pairwise/common";
import { ERROR_CODES } from "src/tools/constants";
import { captureSentryException } from "src/tools/sentry-utils";

export type Strategy = "GitHub" | "Facebook" | "Google";

interface LoginSuccess {
  token: string;
  accountCreated: boolean;
}

type LoginServiceReturnType = Promise<
  Result<LoginSuccess, ERROR_CODES.UNKNOWN_LOGIN_ERROR>
>;

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
    const sign = this.jwtService.sign({ email });
    console.log(sign);

    const result = this.jwtService.decode(sign);
    console.log(result);
  }

  public async handleFacebookSignin(
    requestProfile: FacebookProfileWithCredentials,
  ) {
    try {
      const facebookAccountId = requestProfile.profile.id;
      const profile = requestProfile.profile._json;

      let user;
      let token;

      const existingUser = await this.userService.findByFacebookProfileId(
        facebookAccountId,
      );

      if (existingUser) {
        user = existingUser;
        token = this.getJwtAccessToken(user.profile);
        return new Ok({ token, accountCreated: false });
      } else {
        const email = profile.email;
        if (email) {
          const userWithEmailExists = await this.userService.findUserByEmail(
            email,
          );

          if (userWithEmailExists) {
            user = await this.userService.updateFacebookAccountId(
              userWithEmailExists.profile,
              facebookAccountId,
            );
            token = this.getJwtAccessToken(user.profile);
            return new Ok({ token, accountCreated: false });
          }
        }

        const avatarUrl = profile.picture.data.url;
        const { first_name, last_name } = profile;
        const name = `${first_name} ${last_name}`;
        const userProfile: GenericUserProfile = {
          email,
          avatarUrl,
          displayName: name,
          givenName: first_name,
          familyName: last_name,
          facebookAccountId,
          githubAccountId: null,
          googleAccountId: null,
        };

        user = await this.userService.createNewUser(userProfile);
        token = this.getJwtAccessToken(user.profile);
        return new Ok({ token, accountCreated: true });
      }
    } catch (err) {
      captureSentryException(err);
      return new Err(ERROR_CODES.UNKNOWN_LOGIN_ERROR);
    }
  }

  public async handleGitHubSignin(
    requestProfile: GitHubProfileWithCredentials,
  ): LoginServiceReturnType {
    try {
      const githubAccountId = requestProfile.profile.id;
      const profile = requestProfile.profile._json;

      let user;
      let token;

      const existingUser = await this.userService.findByGithubProfileId(
        githubAccountId,
      );

      if (existingUser) {
        user = existingUser;
        token = this.getJwtAccessToken(user.profile);
        return new Ok({ token, accountCreated: false });
      } else {
        const email = profile.email;
        if (email) {
          const userWithEmailExists = await this.userService.findUserByEmail(
            email,
          );

          if (userWithEmailExists) {
            user = await this.userService.updateGithubAccountId(
              userWithEmailExists.profile,
              githubAccountId,
            );
            token = this.getJwtAccessToken(user.profile);
            return new Ok({ token, accountCreated: false });
          }
        }

        const [firstName = "", lastName = ""] = profile.name.split(" ");
        const avatarUrl = profile.avatar_url;
        const userProfile: GenericUserProfile = {
          email,
          avatarUrl,
          givenName: firstName,
          familyName: lastName,
          displayName: profile.name,
          githubAccountId,
          facebookAccountId: null,
          googleAccountId: null,
        };

        user = await this.userService.createNewUser(userProfile);
        token = this.getJwtAccessToken(user.profile);
        return new Ok({ token, accountCreated: true });
      }
    } catch (err) {
      captureSentryException(err);
      return new Err(ERROR_CODES.UNKNOWN_LOGIN_ERROR);
    }
  }

  public async handleGoogleSignin(
    requestProfile: GoogleProfileWithCredentials,
  ): LoginServiceReturnType {
    try {
      const googleAccountId = requestProfile.profile.id;
      const profile = requestProfile.profile._json;

      let user;
      let token;

      const existingUser = await this.userService.findByGoogleProfileId(
        googleAccountId,
      );

      if (existingUser) {
        token = this.getJwtAccessToken(existingUser.profile);
        return new Ok({ token, accountCreated: false });
      } else {
        const email = profile.email;
        if (email) {
          const userWithEmailExists = await this.userService.findUserByEmail(
            email,
          );

          if (userWithEmailExists) {
            user = await this.userService.updateGoogleAccountId(
              userWithEmailExists.profile,
              googleAccountId,
            );
            token = this.getJwtAccessToken(user.profile);
            return new Ok({ token, accountCreated: false });
          }
        }

        const avatarUrl = profile.picture;
        const userProfile: GenericUserProfile = {
          email,
          avatarUrl,
          displayName: profile.name,
          givenName: profile.given_name,
          familyName: profile.family_name,
          googleAccountId,
          githubAccountId: null,
          facebookAccountId: null,
        };

        user = await this.userService.createNewUser(userProfile);
        token = this.getJwtAccessToken(user.profile);
        return new Ok({ token, accountCreated: true });
      }
    } catch (err) {
      captureSentryException(err);
      return new Err(ERROR_CODES.UNKNOWN_LOGIN_ERROR);
    }
  }

  private getJwtAccessToken(user: UserProfile) {
    const payload: JwtPassportSignPayload = {
      uuid: user.uuid,
    };

    return this.jwtService.sign(payload);
  }
}
