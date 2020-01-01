import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserEntity } from "./user.entity";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { PaymentsEntity } from "src/payments/payments.entity";

@Module({
  providers: [UserService],
  controllers: [UserController],
  imports: [TypeOrmModule.forFeature([UserEntity, PaymentsEntity])],
  exports: [TypeOrmModule, UserService],
})
export class UsersModule {}
