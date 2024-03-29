import { Injectable, BadRequestException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { JwtPassportSignPayload } from "./strategies/jwt.strategy";
import { FacebookProfileWithCredentials } from "./strategies/facebook.strategy";
import { GitHubProfileWithCredentials } from "./strategies/github.strategy";
import { GoogleProfileWithCredentials } from "./strategies/google.strategy";
import { GenericUserProfile, UserService } from "../user/user.service";
import { UserProfile, Ok, Err, Result } from "@pairwise/common";
import { ERROR_CODES } from "../tools/constants";
import { captureSentryException } from "../tools/sentry-utils";
import ENV from "../tools/server-env";
import { emailService, EmailService } from "../email/email.service";
import { validateEmailUpdateRequest } from "../tools/validation-utils";
import { RequestUser } from "../types";
import { isAdminEmail } from "./admin-auth";

export type SigninStrategy = "Email" | "GitHub" | "Facebook" | "Google";

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

  public async generateUpdateEmailLink(email: string, uuid: string) {
    const payload = this.jwtService.sign({ uuid, email });
    const updateEmailLink = `${ENV.SERVER_HOST_URL}/auth/update-email/${payload}`;
    return updateEmailLink;
  }

  public async sendEmailVerificationMessage(user: RequestUser, email: string) {
    if (validateEmailUpdateRequest(email)) {
      // Check there the email is not taken
      const existingUser = await this.userService.findUserByEmail(email);
      if (existingUser) {
        throw new BadRequestException(ERROR_CODES.EMAIL_TAKEN);
      }

      const { uuid } = user.profile;
      const verificationLink = await this.generateUpdateEmailLink(email, uuid);
      await this.emailService.sendEmailVerificationLink(
        email,
        verificationLink,
      );
    } else {
      throw new BadRequestException("Invalid Email");
    }
  }

  public async handleUserUpdateEmailRequest(payload: any) {
    const result = this.decodeUserUpdateEmailPayload(payload);
    if (result.ok) {
      const { email, uuid } = result.value;
      this.userService.updateUserEmail(email, uuid);
    } else {
      throw new BadRequestException("Invalid Request");
    }
  }

  private decodeUserUpdateEmailPayload(
    payload: any,
  ): Result<{ email: string; uuid: string }, string> {
    const result: any = this.jwtService.decode(payload);
    if ("uuid" in result && "email" in result) {
      return Ok(result);
    } else {
      return Err("Invalid Payload");
    }
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
          // Mark email as verified
          await this.userService.markEmailAsVerified(existingUser.profile.uuid);
          // Generate an access token
          const token = this.generateJwtAccessToken(existingUser.profile);
          return Ok({ token, accountCreated: false });
        } else {
          const userProfile: GenericUserProfile = {
            email,
            emailVerified: true,
            avatarUrl: "",
            username: null,
            givenName: "",
            familyName: "",
            facebookAccountId: null,
            githubAccountId: null,
            googleAccountId: null,
          };

          const user = await this.userService.createNewUser(
            userProfile,
            "Email",
          );
          const token = this.generateJwtAccessToken(user.profile);
          return Ok({ token, accountCreated: true });
        }
      } else {
        throw new Error("Request payload was invalid");
      }
    } catch (err) {
      return Err(ERROR_CODES.EMAIL_LOGIN_ERROR);
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
        token = this.generateJwtAccessToken(user.profile);
        return Ok({ token, accountCreated: false });
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
            token = this.generateJwtAccessToken(user.profile);
            return Ok({ token, accountCreated: false });
          }
        }

        const avatarUrl = profile.picture.data.url;
        const { first_name, last_name } = profile;
        const givenName = first_name || "";
        const familyName = last_name || "";

        const userProfile: GenericUserProfile = {
          email,
          emailVerified: false,
          avatarUrl,
          givenName,
          familyName,
          facebookAccountId,
          username: null,
          githubAccountId: null,
          googleAccountId: null,
        };

        user = await this.userService.createNewUser(userProfile, "Facebook");
        token = this.generateJwtAccessToken(user.profile);
        return Ok({ token, accountCreated: true });
      }
    } catch (err) {
      captureSentryException(err);
      return Err(ERROR_CODES.UNKNOWN_LOGIN_ERROR);
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
        token = this.generateJwtAccessToken(user.profile);
        return Ok({ token, accountCreated: false });
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
            token = this.generateJwtAccessToken(user.profile);
            return Ok({ token, accountCreated: false });
          }
        }

        let firstName = "";
        let lastName = "";

        // profile.name can be null
        if (profile.name) {
          const name = profile.name.split(" ");
          firstName = name[0] || "";
          lastName = name[1] || "";
        }

        const avatarUrl = profile.avatar_url;
        const userProfile: GenericUserProfile = {
          email,
          emailVerified: false,
          avatarUrl,
          username: null,
          givenName: firstName,
          familyName: lastName,
          githubAccountId,
          facebookAccountId: null,
          googleAccountId: null,
        };

        user = await this.userService.createNewUser(userProfile, "GitHub");
        token = this.generateJwtAccessToken(user.profile);
        return Ok({ token, accountCreated: true });
      }
    } catch (err) {
      captureSentryException(err);
      return Err(ERROR_CODES.UNKNOWN_LOGIN_ERROR);
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
        token = this.generateJwtAccessToken(existingUser.profile);
        return Ok({ token, accountCreated: false });
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
            token = this.generateJwtAccessToken(user.profile);
            return Ok({ token, accountCreated: false });
          }
        }

        const avatarUrl = profile.picture;
        const userProfile: GenericUserProfile = {
          email,
          emailVerified: false,
          avatarUrl,
          username: null,
          givenName: profile.given_name || "",
          familyName: profile.family_name || "",
          googleAccountId,
          githubAccountId: null,
          facebookAccountId: null,
        };

        user = await this.userService.createNewUser(userProfile, "Google");
        token = this.generateJwtAccessToken(user.profile);
        return Ok({ token, accountCreated: true });
      }
    } catch (err) {
      captureSentryException(err);
      return Err(ERROR_CODES.UNKNOWN_LOGIN_ERROR);
    }
  }

  public async handleGoogleAdminSignin(
    requestProfile: GoogleProfileWithCredentials,
  ): LoginServiceReturnType {
    try {
      const googleAccountId = requestProfile.profile.id;
      const existingUser = await this.userService.findByGoogleProfileId(
        googleAccountId,
      );

      if (existingUser) {
        const user = existingUser;
        const email = user.profile.email;

        if (isAdminEmail(email)) {
          const token = this.generateJwtAccessToken(existingUser.profile);
          return Ok({ token, accountCreated: false });
        } else {
          throw new Error("Unauthorized.");
        }
      } else {
        throw new Error(
          "Account creation not supported for admin authentication.",
        );
      }
    } catch (err) {
      return Err(ERROR_CODES.UNKNOWN_LOGIN_ERROR);
    }
  }

  /**
   * Invalidate a jwt for the user logout flow.
   *
   * This currently does not happen - jwt tokens cannot be invalidated. To
   * actually invalidate it, we would have to persist a list of blacklisted
   * (logged out) tokens or use some other method which would subsequently be
   * checked in the authentication flow for requests. That logic, if added,
   * could live in this function.
   */
  public invalidateJwtAccessToken(token: string) {
    // TODO: No implementation.
    return;
  }

  private generateJwtAccessToken(user: UserProfile) {
    const payload: JwtPassportSignPayload = {
      uuid: user.uuid,
    };

    return this.jwtService.sign(payload);
  }
}
