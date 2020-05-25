import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";

import { AppService } from "./app.service";
import { AppController } from "./app.controller";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./user/user.module";
import { ContentModule } from "./content/content.module";
import { ProgressModule } from "./progress/progress.module";
import { PaymentsModule } from "./payments/payments.module";
import { AdminModule } from "./admin/admin.module";
import { FeedbackModule } from "./feedback/feedback.module";
import { BlobModule } from "./blob/blob.module";
import ENV from "./tools/server-env";

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: "postgres",
      host: ENV.TYPEORM_HOST,
      port: ENV.TYPEORM_PORT,
      username: ENV.TYPEORM_USERNAME,
      password: ENV.TYPEORM_PASSWORD,
      database: ENV.TYPEORM_DATABASE,
      autoLoadEntities: true,
    }),
    AuthModule,
    BlobModule,
    UsersModule,
    ContentModule,
    ProgressModule,
    PaymentsModule,
    AdminModule,
    FeedbackModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
