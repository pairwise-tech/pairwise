import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
} from "typeorm";
import { User } from "../user/user.entity";
import { IUserCourseProgressDto } from "@prototype/common";

@Entity()
export class UserCourseProgress {
  @PrimaryGeneratedColumn("uuid")
  uuid: number;

  @Index()
  @Column()
  courseId: string;

  @Column({ type: "jsonb", nullable: true })
  progress: string;

  @ManyToOne(
    type => User,
    user => user.challengeProgressHistory,
  )
  user: User;
}
