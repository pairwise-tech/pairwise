import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsBoolean, IsString } from "class-validator";

export interface ProgressHistory {
  [key: string]: IUserCourseProgressDto;
}

export interface IUserCourseProgressDto {
  passed: boolean;
  challengeId: string;
}

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
