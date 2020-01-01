import { Injectable } from "@nestjs/common";
import FacebookTokenStrategy from "passport-facebook-token";
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

export interface FacebookProfile {
  provider: string;
  id: string;
  gender: string;
  emails: ListValues;
  photos: ListValues;
  displayName: string;
  name: {
    familyName: string;
    givenName: string;
    middleName: string;
  };
}

export interface FacebookProfileWithCredentials {
  profile: FacebookProfile;
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class FacebookStrategy {
  constructor() {
    this.init();
  }

  init() {
    use(
      new FacebookTokenStrategy(
        {
          fbGraphVersion: "v3.0",
          clientID: ENV.FB_APP_CLIENT_ID,
          clientSecret: ENV.FB_APP_CLIENT_SECRET,
          profileURL: ENV.FB_OAUTH_SERVICE_URL,
        },
        async (
          accessToken: string,
          refreshToken: string,
          profile: FacebookProfile,
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
