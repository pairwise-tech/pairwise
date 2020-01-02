import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsBoolean, IsString } from "class-validator";
import { IUserCourseProgressDto } from "@prototype/common";

export class UserCourseProgressDto implements IUserCourseProgressDto {
  @IsBoolean()
  @IsNotEmpty()
  @ApiProperty({ type: "boolean" })
  passed: boolean;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: "string" })
  challengeId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: "string" })
  courseId: string;
}
