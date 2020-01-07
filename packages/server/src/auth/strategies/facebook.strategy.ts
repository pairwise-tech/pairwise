import { Injectable } from "@nestjs/common";
import { Strategy as FacebookPassportStrategy } from "passport-facebook";
import { use } from "passport";
import ENV from "src/tools/server-env";

export interface FacebookProfile {
  provider: "facebook";
  _json: {
    id: string;
    email: string;
    last_name: string;
    first_name: string;
    picture: {
      data: {
        height: number;
        width: number;
        url: string;
        is_silhouette: boolean;
      };
    };
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
      new FacebookPassportStrategy(
        {
          profileURL: ENV.FB_PROFILE_URL,
          clientID: ENV.FB_CLIENT_ID,
          clientSecret: ENV.FB_CLIENT_SECRET,
          callbackURL: `${ENV.SERVER_HOST_URL}/auth/facebook/callback`,
          assReqToCallback: true,
          profileFields: ["id", "emails", "name", "picture"],
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
