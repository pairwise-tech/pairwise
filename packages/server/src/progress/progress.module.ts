import { Module } from "@nestjs/common";
import { ProgressController } from "./progress.controller";
import { ProgressService } from "./progress.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Progress } from "./progress.entity";
import { UsersModule } from "src/user/user.module";

@Module({
  controllers: [ProgressController],
  providers: [ProgressService],
  imports: [TypeOrmModule.forFeature([Progress]), UsersModule],
  exports: [TypeOrmModule],
})
export class ProgressModule {}
