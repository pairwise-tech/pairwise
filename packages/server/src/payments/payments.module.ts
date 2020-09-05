import { Module } from "@nestjs/common";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersModule } from "../user/user.module";
import { Payments } from "./payments.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Payments]), UsersModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
