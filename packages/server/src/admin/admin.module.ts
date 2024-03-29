import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { FeedbackModule } from "../feedback/feedback.module";
import { UsersModule } from "../user/user.module";
import { PaymentsModule } from "../payments/payments.module";
import { ProgressModule } from "../progress/progress.module";
import { ContentModule } from "../content/content.module";
import { BlobModule } from "../blob/blob.module";
import { AuthModule } from "../auth/auth.module";
import { ChallengeMetaModule } from "../challenge-meta/challenge-meta.module";

@Module({
  imports: [
    AuthModule,
    UsersModule,
    PaymentsModule,
    FeedbackModule,
    ProgressModule,
    BlobModule,
    ContentModule,
    ChallengeMetaModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
