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
import { PAYMENT_STATUS } from "@pairwise/common";

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
  public uuid: number;

  @Index()
  @Column()
  public courseId: string;

  @Column({ type: "timestamp" })
  public datePaid: Date;

  @Column()
  public amountPaid: number;

  @Column()
  public status: PAYMENT_STATUS;

  @Column({ type: "json", nullable: true })
  public extraData: string;

  @ManyToOne(
    type => User,
    user => user.payments,
  )
  public user: User;

  @CreateDateColumn({ type: "timestamp" })
  public createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  public updatedAt: Date;
}
