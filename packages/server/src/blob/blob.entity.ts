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

/** ===========================================================================
 * Entity
 * ----------------------------------------------------------------------------
 * The CodeBlob represents the flexible data type which stores the specific
 * history for each challenge for each user. The blob is associated with a user
 * and challenge and then contains a flexible json blob structure which holds
 * the challenge specific information.
 * ============================================================================
 */

@Entity()
export class CodeBlob {
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
    { onDelete: "CASCADE" },
  )
  user: User;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;
}
