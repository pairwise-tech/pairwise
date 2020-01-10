import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, ValidateNested } from "class-validator";
import { IUserCodeBlobDto, CodeHistoryBlob } from "@pairwise/common";

export class BlobDto implements IUserCodeBlobDto {
  @IsNotEmpty()
  @ValidateNested()
  @ApiProperty({ type: () => BlobDto })
  dataBlob: CodeHistoryBlob;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: "string" })
  challengeId: string;
}
