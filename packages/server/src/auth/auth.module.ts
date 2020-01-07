import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { FacebookStrategy } from "./strategies/facebook.strategy";
import { UsersModule } from "src/user/user.module";
import { AuthService } from "./auth.service";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { JwtStrategy } from "./strategies/jwt.strategy";
import ENV from "src/tools/server-env";
import { GitHubStrategy } from "./strategies/github.strategy";
import { GoogleStrategy } from "./strategies/google.strategy";

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: ENV.JWT_SECRET,
      signOptions: { expiresIn: "60s" },
    }),
    PassportModule.register({
      session: true,
      scope: ["profile", "email"],
      defaultStrategy: "google",
    }),
    PassportModule.register({
      session: false,
      scope: ["profile", "email"],
      defaultStrategy: "facebook",
    }),
    UsersModule,
  ],
  providers: [
    JwtStrategy,
    GitHubStrategy,
    GoogleStrategy,
    FacebookStrategy,
    AuthService,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
