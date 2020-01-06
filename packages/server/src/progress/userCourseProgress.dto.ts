import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsBoolean, IsString } from "class-validator";
import { IUserCourseProgressDto } from "@pairwise/common";

export class UserCourseProgressDto implements IUserCourseProgressDto {
  @IsBoolean()
  @IsNotEmpty()
  @ApiProperty({ type: "boolean" })
  complete: boolean;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: "string" })
  challengeId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: "string" })
  courseId: string;
}
