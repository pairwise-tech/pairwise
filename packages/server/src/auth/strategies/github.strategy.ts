import { Injectable } from "@nestjs/common";
import { Strategy as GitHubPassportStrategy } from "passport-github";
import { use } from "passport";
import ENV from "../../tools/server-env";

export interface GitHubProfile {
  provider: "github";
  id: string;
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

  private init() {
    use(
      new GitHubPassportStrategy(
        {
          clientID: ENV.GITHUB_CLIENT_ID,
          clientSecret: ENV.GITHUB_CLIENT_SECRET,
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
