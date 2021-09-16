import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

/** ===========================================================================
 * Challenge Meta Entity
 * ----------------------------------------------------------------------------
 * This represents metadata associated with challenges, such as the total
 * number of times a challenge has been attempted and completed. These
 * numbers include anonymous and registered users.
 * ============================================================================
 */

@Entity()
export class ChallengeMeta {
  @PrimaryGeneratedColumn("uuid")
  public uuid: number;

  @Index()
  @Column()
  public challengeId: string;

  @Column({ default: 0 })
  public numberOfTimesAttempted: number;

  @Column({ default: 0 })
  public numberOfTimesCompleted: number;

  @CreateDateColumn({ type: "timestamp" })
  public createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  public updatedAt: Date;
}
