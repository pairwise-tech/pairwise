import { Module } from "@nestjs/common";
import { FeedbackController } from "./feedback.controller";
import { FeedbackService } from "./feedback.service";
import { Feedback } from "./feedback.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersModule } from "../user/user.module";

@Module({
  controllers: [FeedbackController],
  providers: [FeedbackService],
  imports: [TypeOrmModule.forFeature([Feedback]), UsersModule],
  exports: [FeedbackService],
})
export class FeedbackModule {}
