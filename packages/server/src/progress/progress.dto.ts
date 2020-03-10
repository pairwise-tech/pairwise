import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsBoolean, IsString } from "class-validator";
import { IProgressDto } from "@pairwise/common";

export class ProgressDto implements IProgressDto {
  @IsBoolean()
  @IsNotEmpty()
  @ApiProperty({ type: "boolean" })
  public complete: boolean;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: "string" })
  public challengeId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: "string" })
  public courseId: string;
}
