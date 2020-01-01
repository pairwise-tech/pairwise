import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
} from "typeorm";
import { UserEntity } from "../user/user.entity";
import { IUserCourseProgressDto } from "@prototype/common";

@Entity()
export class UserCourseProgressEntity {
  @PrimaryGeneratedColumn("uuid")
  uuid: number;

  @Index()
  @Column()
  courseId: string;

  @Column({ type: "jsonb", nullable: true })
  progress: string;

  @ManyToOne(
    type => UserEntity,
    user => user.challengeProgressHistory,
  )
  user: UserEntity;
}
