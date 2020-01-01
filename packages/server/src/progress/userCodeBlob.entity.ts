import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
} from "typeorm";
import { UserEntity } from "../user/user.entity";

@Entity()
export class UserCodeBlobEntity {
  @PrimaryGeneratedColumn("uuid")
  uuid: number;

  @Index()
  @Column()
  challengeId: string;

  @Column({ type: "jsonb" })
  dataBlob: string;

  @ManyToOne(
    type => UserEntity,
    user => user.challengeCodeHistory,
  )
  user: UserEntity;
}
