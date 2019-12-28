import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { FacebookStrategy } from "./strategies/facebook.strategy";
import { UsersModule } from "src/user/user.module";
import { AuthService } from "./auth.service";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { JwtStrategy } from "./strategies/jwt.strategy";
import ENV from "src/tools/env";
import { GitHubStrategy } from "./strategies/github.strategy";

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: ENV.JWT_SECRET,
      signOptions: { expiresIn: "60s" },
    }),
    UsersModule,
  ],
  providers: [JwtStrategy, GitHubStrategy, AuthService, FacebookStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
