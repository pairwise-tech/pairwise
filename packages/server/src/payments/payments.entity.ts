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
import { PAYMENT_TYPE } from "@pairwise/common";

/** ===========================================================================
 * Entity
 * ----------------------------------------------------------------------------
 * The Payment entity represents a user payment for a course. The payment
 * information is how we determine if a user has full access to a course or
 * not.
 * ============================================================================
 */

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

  @Column()
  type: PAYMENT_TYPE;

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
