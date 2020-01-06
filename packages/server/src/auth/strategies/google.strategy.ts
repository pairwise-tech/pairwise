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
  // TODO: type
  x: any;
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
          callbackURL: "http://127.0.0.1:9000/auth/google/callback",
        },
        async (
          accessToken: string,
          refreshToken: string,
          profile: GoogleProfile,
          done: (err, user) => void,
        ) => {
          console.log(profile);

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
