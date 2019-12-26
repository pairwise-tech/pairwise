import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

interface IUserCodeBlobDto {
  code: string;
  challengeId: string;
}

export class UserCodeBlobDto implements IUserCodeBlobDto {
  @IsNotEmpty()
  @ApiProperty({ type: "string" })
  code: string;

  @IsNotEmpty()
  @ApiProperty({ type: "string" })
  challengeId: string;
}
