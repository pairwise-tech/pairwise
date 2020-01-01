import { Module } from "@nestjs/common";
import { ProgressController } from "./progress.controller";
import { ProgressService } from "./progress.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserCourseProgressEntity } from "./userCourseProgress.entity";
import { UserCodeBlobEntity } from "./userCodeBlob.entity";
import { UsersModule } from "src/user/user.module";

@Module({
  controllers: [ProgressController],
  providers: [ProgressService],
  imports: [
    TypeOrmModule.forFeature([UserCourseProgressEntity, UserCodeBlobEntity]),
    UsersModule,
  ],
  exports: [TypeOrmModule],
})
export class ProgressModule {}
