import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { FeedbackService } from "src/feedback/feedback.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Feedback } from "src/feedback/feedback.entity";
import { SlackService } from "src/slack/slack.service";

@Module({
  controllers: [AdminController],
  providers: [AdminService, FeedbackService, SlackService],
  imports: [TypeOrmModule.forFeature([Feedback])],
})
export class AdminModule {}
