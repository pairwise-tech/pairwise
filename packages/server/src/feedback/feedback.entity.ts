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
import { FEEDBACK_TYPE, IFeedbackDto } from "@pairwise/common";

/** ===========================================================================
 * Entity
 * ----------------------------------------------------------------------------
 * The Feedback entity contains feedback from a user about a specific
 * challenge. We store this directly to better incorporate with our product
 * and channel feedback directly in a way for us to address quickly and
 * improve the quality of our product and courses.
 * ============================================================================
 */

@Entity()
export class Feedback implements IFeedbackDto {
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
