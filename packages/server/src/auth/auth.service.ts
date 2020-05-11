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
import ENV from "src/tools/server-env";
import { emailService, EmailService } from "src/email/email.service";

export type Strategy = "Email" | "GitHub" | "Facebook" | "Google";

interface LoginSuccess {
  token: string;
  accountCreated: boolean;
}

type LoginServiceReturnType = Promise<
  Result<LoginSuccess, ERROR_CODES.UNKNOWN_LOGIN_ERROR>
>;

@Injectable()
export class AuthService {
  private readonly emailService: EmailService = emailService;

  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  public async handleEmailLoginRequest(email: string) {
    const magicEmailToken = this.jwtService.sign({ email });
    const magicEmailLink = `${ENV.SERVER_HOST_URL}/auth/magic-link/${magicEmailToken}`;
    this.emailService.sendMagicEmailLink(email, magicEmailLink);
  }

  public async handleEmailLoginVerification(magicEmailToken: string) {
    try {
      // Decode the token payload. If an email is present then proceed
      // with authentication.
      const result: any = this.jwtService.decode(magicEmailToken);

      if (result && "email" in result) {
        const { email } = result;

        const existingUser = await this.userService.findUserByEmail(email);

        // If a user exists, just log them in. Otherwise create a new user
        // with this email address.
        if (existingUser) {
          const token = this.getJwtAccessToken(existingUser.profile);
          return new Ok({ token, accountCreated: false });
        } else {
          const userProfile: GenericUserProfile = {
            email,
            avatarUrl: "",
            displayName: "",
            givenName: "",
            familyName: "",
            facebookAccountId: null,
            githubAccountId: null,
            googleAccountId: null,
          };

          const user = await this.userService.createNewUser(userProfile);
          const token = this.getJwtAccessToken(user.profile);
          return new Ok({ token, accountCreated: true });
        }
      } else {
        throw new Error("Request payload was invalid");
      }
    } catch (err) {
      return new Err(ERROR_CODES.EMAIL_LOGIN_ERROR);
    }
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

        let firstName = "";
        let lastName = "";

        // profile.name can be null
        if (!!profile.name) {
          const name = profile.name.split(" ");
          firstName = name[0] || "";
          lastName = name[1] || "";
        }

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
        user = existingUser;
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
