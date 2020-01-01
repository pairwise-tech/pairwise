import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
} from "typeorm";
import { UserEntity } from "../user/user.entity";

@Entity()
export class PaymentsEntity {
  @PrimaryGeneratedColumn("uuid")
  uuid: number;

  @Index()
  @Column()
  courseId: string;

  @Column()
  datePaid: string;

  @ManyToOne(
    type => UserEntity,
    user => user.payments,
  )
  user: UserEntity;
}
