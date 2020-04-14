import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import ENV from "src/tools/server-env";
import { UserService } from "src/user/user.service";

export interface JwtPassportPayload {
  email: string;
  userId: string;
}

export interface JwtPassportSignPayload {
  uuid: string;
}

/** ===========================================================================
 * Jwt Passport Strategy
 * ----------------------------------------------------------------------------
 * This was created using the guide from the NestJS docs:
 * - https://docs.nestjs.com/techniques/authentication
 * ============================================================================
 */

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userService: UserService) {
    super({
      ignoreExpiration: false,
      secretOrKey: ENV.JWT_SECRET,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  public async validate(payload: JwtPassportSignPayload) {
    const { uuid } = payload;

    /**
     * Verify the jwt payload has a uuid. By the way, if the jwt payload
     * structure every needs to change in the future be aware that this
     * will impact any existing access tokens out in the wild.
     */
    if (!uuid || typeof uuid !== "string") {
      throw new UnauthorizedException();
    }

    return this.userService.findUserByUuidGetFullProfile(uuid);
  }
}
