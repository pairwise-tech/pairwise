import { Injectable } from "@nestjs/common";
import { Strategy as GitHubPassportStrategy } from "passport-github";
import { use } from "passport";
import ENV from "src/tools/server-env";

/** ===========================================================================
 * Facebook Passport Strategy
 * ----------------------------------------------------------------------------
 * Reference:
 * - https://medium.com/@baptiste.arnaud95/how-to-handle-facebook-login-with-nestjs-89c5c30d566c
 * - https://github.com/baptisteArnaud/facebook-login-nestjs-example
 * ============================================================================
 */

type ListValues = Array<{ value: string }>;

export interface GitHubProfile {
  provider: string;
  _json: {
    id: string;
    name: string;
    email: string;
    avatar_url: string;
  };
}

export interface GitHubProfileWithCredentials {
  profile: GitHubProfile;
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class GitHubStrategy {
  constructor() {
    this.init();
  }

  init() {
    use(
      new GitHubPassportStrategy(
        {
          clientID: ENV.GITHUB_APP_CLIENT_ID,
          clientSecret: ENV.GITHUB_APP_CLIENT_SECRET,
          userProfileURL: ENV.GITHUB_PROFILE_URL,
          tokenURL: ENV.GITHUB_TOKEN_URL,
          authorizationURL: ENV.GITHUB_AUTHORIZATION_URL,
          callbackURL: `${ENV.SERVER_HOST_URL}/auth/github/callback`,
        },
        async (accessToken, refreshToken, profile, done) => {
          return done(null, {
            profile,
            accessToken,
            refreshToken,
          });
        },
      ),
    );
  }
}
