import { Module } from "@nestjs/common";
import { FeedbackController } from "./feedback.controller";
import { FeedbackService } from "./feedback.service";
import { Feedback } from "./feedback.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersModule } from "../user/user.module";

@Module({
  imports: [TypeOrmModule.forFeature([Feedback]), UsersModule],
  controllers: [FeedbackController],
  providers: [FeedbackService],
  exports: [FeedbackService],
})
export class FeedbackModule {}
