import { Module } from "@nestjs/common";
import { ProgressController } from "./progress.controller";
import { ProgressService } from "./progress.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Progress } from "./progress.entity";

@Module({
  controllers: [ProgressController],
  providers: [ProgressService],
  imports: [TypeOrmModule.forFeature([Progress])],
  exports: [TypeOrmModule, ProgressService],
})
export class ProgressModule {}
