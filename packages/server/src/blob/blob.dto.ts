import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, ValidateNested } from "class-validator";
import { DataBlob, ICodeBlobDto } from "@pairwise/common";

export class BlobDto implements ICodeBlobDto {
  @IsNotEmpty()
  @ValidateNested()
  @ApiProperty({ type: () => BlobDto })
  public dataBlob: DataBlob;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: "string" })
  public challengeId: string;
}
