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
import { ProgressModule } from "./progress/progress.module";
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot(),
    AuthModule,
    UsersModule,
    ChallengesModule,
    ProgressModule,
    PaymentsModule,
  ],
  controllers: [AppController, ChallengesController],
  providers: [AppService, UserService],
})
export class AppModule {}
