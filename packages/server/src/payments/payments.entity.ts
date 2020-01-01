import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
} from "typeorm";
import { User } from "../user/user.entity";

@Entity()
export class Payments {
  @PrimaryGeneratedColumn("uuid")
  uuid: number;

  @Index()
  @Column()
  courseId: string;

  @Column()
  datePaid: string;

  @ManyToOne(
    type => User,
    user => user.payments,
  )
  user: User;
}
