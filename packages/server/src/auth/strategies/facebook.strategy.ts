import { Injectable } from "@nestjs/common";
import { Strategy as FacebookPassportStrategy } from "passport-facebook";
import { use } from "passport";
import ENV from "../../tools/server-env";

export interface FacebookProfile {
  provider: "facebook";
  id: string;
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

  private init() {
    use(
      new FacebookPassportStrategy(
        {
          clientID: ENV.FACEBOOK_CLIENT_ID,
          clientSecret: ENV.FACEBOOK_CLIENT_SECRET,
          tokenURL: ENV.FACEBOOK_TOKEN_URL,
          profileURL: ENV.FACEBOOK_PROFILE_URL,
          authorizationURL: ENV.FACEBOOK_AUTHORIZATION_URL,
          callbackURL: `${ENV.SERVER_HOST_URL}/auth/facebook/callback`,
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
