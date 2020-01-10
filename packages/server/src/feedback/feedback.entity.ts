import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
  UpdateDateColumn,
  CreateDateColumn,
} from "typeorm";
import { User } from "../user/user.entity";
import { FEEDBACK_TYPE } from "@pairwise/common";

@Entity()
export class Feedback {
  @PrimaryGeneratedColumn("uuid")
  uuid: number;

  @Index()
  @Column()
  challengeId: string;

  @Column()
  feedback: string;

  @Column()
  type: FEEDBACK_TYPE;

  @ManyToOne(
    type => User,
    user => user.userFeedback,
  )
  user: User;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;
}
