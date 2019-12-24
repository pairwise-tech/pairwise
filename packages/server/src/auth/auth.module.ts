import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { FacebookStrategy } from "./facebook.strategy";
import { ConfigModule } from "@nestjs/config";
import { UsersModule } from "src/user/user.module";

@Module({
  imports: [ConfigModule.forRoot(), UsersModule],
  providers: [FacebookStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
