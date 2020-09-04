import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { FeedbackModule } from "src/feedback/feedback.module";
import { UsersModule } from "src/user/user.module";

@Module({
  imports: [UsersModule, FeedbackModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
