import { Injectable } from "@nestjs/common";
import { Strategy as GooglePassportStrategy } from "passport-google-oauth20";
import { use } from "passport";
import ENV from "../../tools/server-env";

export interface GoogleProfile {
  provider: "google";
  id: string;
  _json: {
    sub: string;
    name: string;
    email: string;
    picture: string;
    given_name: string;
    family_name: string;
    locale: string;
    email_verified: string;
  };
}

export interface GoogleProfileWithCredentials {
  profile: GoogleProfile;
  accessToken: string;
  refreshToken: string;
}

/**
 * NOTE: This passport strategy is specifically used for admin authentication.
 * It uses a separate callback which validates the provided user against a
 * set of whitelisted admin emails.
 */
@Injectable()
export class GoogleAdminStrategy {
  constructor() {
    this.init();
  }

  private init() {
    use(
      "google-admin",
      new GooglePassportStrategy(
        {
          clientID: ENV.GOOGLE_CLIENT_ID,
          clientSecret: ENV.GOOGLE_CLIENT_SECRET,
          userProfileURL: ENV.GOOGLE_ADMIN_PROFILE_URL,
          tokenURL: ENV.GOOGLE_ADMIN_TOKEN_URL,
          authorizationURL: ENV.GOOGLE_ADMIN_TOKEN_URL,
          callbackURL: `${ENV.SERVER_HOST_URL}/auth/google-admin/callback`,
          scope: ["profile", "email"],
        },
        async (
          accessToken: string,
          refreshToken: string,
          profile: GoogleProfile,
          done: (err, user) => void,
        ) => {
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
