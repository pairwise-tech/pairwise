import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { FeedbackService } from "src/feedback/feedback.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Feedback } from "src/feedback/feedback.entity";
import { SlackService } from "src/slack/slack.service";
import { UserService } from "src/user/user.service";
import { ProgressService } from "src/progress/progress.service";
import { User } from "src/user/user.entity";
import { Payments } from "src/payments/payments.entity";
import { Progress } from "src/progress/progress.entity";

@Module({
  controllers: [AdminController],
  providers: [
    AdminService,
    FeedbackService,
    SlackService,
    UserService,
    ProgressService,
  ],
  imports: [TypeOrmModule.forFeature([Feedback, User, Payments, Progress])],
})
export class AdminModule {}
