import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";

import { AppService } from "./app.service";
import { AppController } from "./app.controller";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./user/user.module";
import { UserService } from "./user/user.service";
import { ChallengesModule } from "./challenges/challenges.module";
import { ChallengesController } from "./challenges/challenges.controller";

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot(),
    AuthModule,
    UsersModule,
    ChallengesModule,
  ],
  controllers: [AppController, ChallengesController],
  providers: [AppService, UserService],
})
export class AppModule {}
