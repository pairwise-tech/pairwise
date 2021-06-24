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
 * number of times a challenge has been completed.
 * ============================================================================
 */

@Entity()
export class ChallengeMeta {
  @PrimaryGeneratedColumn("uuid")
  public uuid: number;

  @Index()
  @Column()
  public challengeId: string;

  @Column()
  public numberOfTimesCompleted: number;

  @CreateDateColumn({ type: "timestamp" })
  public createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  public updatedAt: Date;
}
