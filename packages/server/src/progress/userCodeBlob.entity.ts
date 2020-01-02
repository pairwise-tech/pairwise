import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
} from "typeorm";
import { User } from "../user/user.entity";

@Entity()
export class UserCodeBlob {
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
}
