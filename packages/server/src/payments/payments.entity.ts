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
import { PAYMENT_PLAN, PAYMENT_STATUS, PAYMENT_TYPE } from "@pairwise/common";

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
  public plan: PAYMENT_PLAN;

  @Column()
  public status: PAYMENT_STATUS;

  @Column()
  paymentType: PAYMENT_TYPE;

  @Column({ type: "json", nullable: true })
  public extraData: string;

  @ManyToOne((type) => User, (user) => user.payments, { onDelete: "CASCADE" })
  public user: User;

  @CreateDateColumn({ type: "timestamp" })
  public createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  public updatedAt: Date;
}
