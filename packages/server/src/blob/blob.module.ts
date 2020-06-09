import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CodeBlob } from "./blob.entity";
import { BlobController } from "./blob.controller";
import { BlobService } from "./blob.service";

@Module({
  controllers: [BlobController],
  providers: [BlobService],
  imports: [TypeOrmModule.forFeature([CodeBlob])],
  exports: [TypeOrmModule],
})
export class BlobModule {}
