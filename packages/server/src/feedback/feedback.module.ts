import { Module } from "@nestjs/common";
import { FeedbackController } from "./feedback.controller";
import { FeedbackService } from "./feedback.service";
import { Feedback } from "./feedback.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersModule } from "src/user/user.module";
import { SlackService } from "src/slack/slack.service";

@Module({
  controllers: [FeedbackController],
  providers: [FeedbackService, SlackService],
  imports: [TypeOrmModule.forFeature([Feedback]), UsersModule],
})
export class FeedbackModule {}
