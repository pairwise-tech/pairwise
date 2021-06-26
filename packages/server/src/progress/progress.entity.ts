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

/** ===========================================================================
 * Entity
 * ----------------------------------------------------------------------------
 * The Progress entity contains the specific progress history for a user on
 * a course. A user has a single progress history per course. The progress
 * history contains a list of objects for each challenge the user has attempted
 * or completed.
 * ============================================================================
 */

@Entity()
export class Progress {
  @PrimaryGeneratedColumn("uuid")
  public uuid: number;

  @Index()
  @Column()
  public courseId: string;

  @Column({ type: "jsonb", nullable: true })
  public progress: string;

  @ManyToOne(
    type => User,
    user => user.challengeProgressHistory,
    {
      onDelete: "CASCADE",
    },
  )
  public user: User;

  @CreateDateColumn({ type: "timestamp" })
  public createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  public updatedAt: Date;
}
