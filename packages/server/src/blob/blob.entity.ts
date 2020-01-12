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

@Entity()
export class CodeBlob {
  @PrimaryGeneratedColumn("uuid")
  uuid: number;

  @Index()
  @Column()
  challengeId: string;

  @Column({ type: "jsonb" })
  dataBlob: string;

  @ManyToOne(
    type => User,
    user => user.challengeCodeHistory,
  )
  user: User;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;
}
