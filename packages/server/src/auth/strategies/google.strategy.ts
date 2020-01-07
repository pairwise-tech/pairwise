import { Injectable } from "@nestjs/common";
import { Strategy as GooglePassportStrategy } from "passport-google-oauth20";

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

export interface GoogleProfile {
  id: string;
  displayName: string;
  name: {
    familyName: string;
    givenName: string;
  };
  emails: ListValues;
  photos: ListValues;
  provider: string;
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

@Injectable()
export class GoogleStrategy {
  constructor() {
    this.init();
  }

  init() {
    use(
      new GooglePassportStrategy(
        {
          clientID: ENV.GOOGLE_CLIENT_ID,
          clientSecret: ENV.GOOGLE_CLIENT_SECRET,
          userProfileURL: ENV.GOOGLE_PROFILE_URL,
          tokenURL: ENV.GOOGLE_TOKEN_URL,
          authorizationURL: ENV.GOOGLE_TOKEN_URL,
          callbackURL: `${ENV.SERVER_HOST_URL}/auth/google/callback`,
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
