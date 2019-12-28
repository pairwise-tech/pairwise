import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { User } from "src/user/user.entity";
import { JwtPassportSignPayload } from "./strategies/jwt.strategy";

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  getJwtAccessToken(user: User) {
    const payload: JwtPassportSignPayload = {
      email: user.email,
      sub: user.uuid,
    };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}
