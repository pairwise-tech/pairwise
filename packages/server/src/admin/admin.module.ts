import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { FeedbackModule } from "../feedback/feedback.module";
import { UsersModule } from "../user/user.module";
import { PaymentsModule } from "../payments/payments.module";
import { ProgressModule } from "../progress/progress.module";

@Module({
  imports: [UsersModule, PaymentsModule, FeedbackModule, ProgressModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
