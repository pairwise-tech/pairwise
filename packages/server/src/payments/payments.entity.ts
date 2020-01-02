import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "../user/user.entity";

@Entity()
export class Payments {
  @PrimaryGeneratedColumn("uuid")
  uuid: number;

  @Index()
  @Column()
  courseId: string;

  @Column({ type: "timestamp" })
  datePaid: Date;

  @Column()
  amountPaid: number;

  @Column({ type: "json", nullable: true })
  extraData: string;

  @ManyToOne(
    type => User,
    user => user.payments,
  )
  user: User;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;
}
