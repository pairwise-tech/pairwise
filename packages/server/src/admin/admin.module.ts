import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { FeedbackModule } from "../feedback/feedback.module";
import { UsersModule } from "../user/user.module";
import { PaymentsModule } from "../payments/payments.module";

@Module({
  controllers: [AdminController],
  providers: [AdminService],
  imports: [UsersModule, PaymentsModule, FeedbackModule],
})
export class AdminModule {}
