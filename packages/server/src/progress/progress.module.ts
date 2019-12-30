import { Module } from "@nestjs/common";
import { ProgressController } from "./progress.controller";
import { ProgressService } from "./progress.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserCourseProgress } from "./userCourseProgress.entity";
import { UserCodeBlob } from "./userCodeBlob.entity";
import { UsersModule } from "src/user/user.module";

@Module({
  controllers: [ProgressController],
  providers: [ProgressService],
  imports: [
    TypeOrmModule.forFeature([UserCourseProgress, UserCodeBlob]),
    UsersModule,
  ],
  exports: [TypeOrmModule],
})
export class ProgressModule {}
