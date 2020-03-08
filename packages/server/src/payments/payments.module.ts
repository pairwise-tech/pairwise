import { Module } from "@nestjs/common";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersModule } from "src/user/user.module";
import { Payments } from "./payments.entity";
import { SlackService } from "src/slack/slack.service";

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, SlackService],
  imports: [TypeOrmModule.forFeature([Payments]), UsersModule],
  exports: [TypeOrmModule],
})
export class PaymentsModule {}
