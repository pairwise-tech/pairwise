import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";
import { IUserCodeBlobDto } from "@prototype/common";

export class UserCodeBlobDto implements IUserCodeBlobDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: "string" })
  dataBlob: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: "string" })
  challengeId: string;
}
