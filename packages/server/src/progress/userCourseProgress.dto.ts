import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export interface ProgressHistory {
  [key: string]: IUserCourseProgressDto;
}

export interface IUserCourseProgressDto {
  passed: boolean;
  challengeId: string;
}

export class UserCourseProgressDto implements IUserCourseProgressDto {
  @IsNotEmpty()
  @ApiProperty({ type: "boolean" })
  passed: boolean;

  @ApiProperty()
  @ApiProperty({ type: "string" })
  challengeId: string;

  @IsNotEmpty()
  @ApiProperty({ type: "string" })
  courseId: string;
}
