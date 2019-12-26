import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
} from "typeorm";
import { User } from "../user/user.entity";
import { ProgressHistory } from "./userCourseProgress.dto";

@Entity()
export class UserCourseProgress {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  courseId: string;

  @Column({ type: "jsonb", nullable: true })
  progress: ProgressHistory;

  @ManyToOne(
    type => User,
    user => user.challengeProgressHistory,
  )
  user: User;
}
