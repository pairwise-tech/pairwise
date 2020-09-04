import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./user.entity";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { Payments } from "../payments/payments.entity";
import { ProgressModule } from "../progress/progress.module";

@Module({
  controllers: [UserController],
  providers: [UserService],
  imports: [TypeOrmModule.forFeature([User, Payments]), ProgressModule],
  exports: [UserService],
})
export class UsersModule {}
