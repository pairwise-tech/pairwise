import { Module, forwardRef } from "@nestjs/common";
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
    PassportModule.register({
      defaultStrategy: "google",
    }),
    JwtModule.register({
      secret: ENV.JWT_SECRET,
      signOptions: { expiresIn: "365 days" }, // Expire in one year, boom baby!
    }),
    forwardRef(() => UsersModule),
  ],
  providers: [
    JwtStrategy,
    GitHubStrategy,
    GoogleStrategy,
    FacebookStrategy,
    AuthService,
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
