import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { FacebookStrategy } from "./strategies/facebook.strategy";
import { UsersModule } from "../user/user.module";
import { AuthService } from "./auth.service";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { JwtStrategy } from "./strategies/jwt.strategy";
import ENV from "../tools/server-env";
import { GitHubStrategy } from "./strategies/github.strategy";
import { GoogleStrategy } from "./strategies/google.strategy";
import { GoogleAdminStrategy } from "./strategies/google-admin.strategy";

@Module({
  imports: [
    PassportModule.register({
      defaultStrategy: "google",
    }),
    JwtModule.register({
      secret: ENV.JWT_SECRET,
      signOptions: { expiresIn: "365 days" }, // Expire in one year, boom!
    }),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [
    JwtStrategy,
    GitHubStrategy,
    GoogleStrategy,
    GoogleAdminStrategy,
    FacebookStrategy,
    AuthService,
  ],
  exports: [AuthService],
})
export class AuthModule {}
