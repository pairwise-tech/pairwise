import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsBoolean, IsString, IsDateString } from "class-validator";
import { IProgressDto } from "@pairwise/common";

export class ProgressDto implements IProgressDto {
  @IsBoolean()
  @IsNotEmpty()
  @ApiProperty({ type: "boolean" })
  public complete: boolean;

  @IsDateString()
  @IsNotEmpty()
  @ApiProperty({ type: "date" })
  public timeCompleted: Date;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: "string" })
  public challengeId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: "string" })
  public courseId: string;
}
