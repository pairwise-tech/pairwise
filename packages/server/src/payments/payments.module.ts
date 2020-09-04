import { Module } from "@nestjs/common";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersModule } from "../user/user.module";
import { Payments } from "./payments.entity";

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService],
  imports: [TypeOrmModule.forFeature([Payments]), UsersModule],
  exports: [PaymentsService],
})
export class PaymentsModule {}
