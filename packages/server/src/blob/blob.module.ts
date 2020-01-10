import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CodeBlob } from "./blob.entity";
import { UsersModule } from "src/user/user.module";
import { BlobController } from "./blob.controller";
import { BlobService } from "./blob.service";

@Module({
  controllers: [BlobController],
  providers: [BlobService],
  imports: [TypeOrmModule.forFeature([CodeBlob]), UsersModule],
  exports: [TypeOrmModule],
})
export class BlobModule {}
