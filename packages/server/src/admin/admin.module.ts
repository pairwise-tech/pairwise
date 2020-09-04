import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { FeedbackModule } from "../feedback/feedback.module";
import { UsersModule } from "../user/user.module";
import { PaymentsModule } from "../payments/payments.module";

@Module({
  imports: [UsersModule, PaymentsModule, FeedbackModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
