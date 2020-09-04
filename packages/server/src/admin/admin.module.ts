import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { FeedbackModule } from "../feedback/feedback.module";
import { UsersModule } from "../user/user.module";

@Module({
  controllers: [AdminController],
  providers: [AdminService],
  imports: [UsersModule, FeedbackModule],
})
export class AdminModule {}
