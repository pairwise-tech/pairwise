import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable } from "@nestjs/common";
import ENV from "src/tools/server-env";

export interface JwtPassportPayload {
  email: string;
  userId: string;
}

export interface JwtPassportSignPayload {
  email: string;
  sub: string;
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
  constructor() {
    super({
      ignoreExpiration: false,
      secretOrKey: ENV.JWT_SECRET,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  async validate(payload: JwtPassportSignPayload) {
    return { userId: payload.sub, email: payload.email };
  }
}
