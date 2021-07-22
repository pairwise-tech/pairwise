import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CodeBlob } from "./blob.entity";
import { BlobController } from "./blob.controller";
import { BlobService } from "./blob.service";

@Module({
  imports: [TypeOrmModule.forFeature([CodeBlob])],
  controllers: [BlobController],
  providers: [BlobService],
  exports: [BlobService],
})
export class BlobModule {}
