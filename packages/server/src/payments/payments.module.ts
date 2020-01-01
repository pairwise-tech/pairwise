import { Module } from "@nestjs/common";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersModule } from "src/user/user.module";
import { PaymentsEntity } from "./payments.entity";

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService],
  imports: [TypeOrmModule.forFeature([PaymentsEntity]), UsersModule],
  exports: [TypeOrmModule],
})
export class PaymentsModule {}
