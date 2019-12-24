import { Injectable } from "@nestjs/common";
import FacebookTokenStrategy from "passport-facebook-token";
import { use } from "passport";
import { ConfigService } from "@nestjs/config";

/** ===========================================================================
 * Types & Config
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

export interface ProfileWithCredentials {
  profile: FacebookProfile;
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class FacebookStrategy {
  constructor(private readonly configService: ConfigService) {
    this.init();
  }

  init() {
    const FB_APP_CLIENT_ID = this.configService.get<string>("FB_APP_CLIENT_ID");
    const FB_APP_CLIENT_SECRET = this.configService.get<string>(
      "FB_APP_CLIENT_SECRET",
    );
    use(
      new FacebookTokenStrategy(
        {
          fbGraphVersion: "v3.0",
          clientID: FB_APP_CLIENT_ID,
          clientSecret: FB_APP_CLIENT_SECRET,
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
