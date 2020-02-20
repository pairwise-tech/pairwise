import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./user.entity";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { Payments } from "src/payments/payments.entity";
import { ProgressModule } from "src/progress/progress.module";
import { SlackService } from "src/slack/slack.service";

@Module({
  providers: [UserService, SlackService],
  controllers: [UserController],
  imports: [TypeOrmModule.forFeature([User, Payments]), ProgressModule],
  exports: [TypeOrmModule, UserService],
})
export class UsersModule {}
