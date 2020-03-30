import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Progress } from "src/progress/progress.entity";
import { Payments } from "src/payments/payments.entity";
import { Feedback } from "src/feedback/feedback.entity";
import { CodeBlob } from "src/blob/blob.entity";

/** ===========================================================================
 * Entity
 * ----------------------------------------------------------------------------
 * The User entity represents Pairwise users. The user contains some basic
 * profile information which is assigned during first login, some app specific
 * settings information, and foreign keys to other tables such as payments,
 * progress, and code blobs.
 * ============================================================================
 */

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  public uuid: string;

  @Column({ unique: true })
  public email: string;

  @Column()
  public displayName: string;

  @Column()
  public givenName: string;

  @Column()
  public familyName: string;

  @Column()
  public lastActiveChallengeId: string;

  @Column()
  public avatarUrl: string;

  @Column({ nullable: true })
  public facebookAccountId: string;

  @Column({ nullable: true })
  public githubAccountId: string;

  @Column({ nullable: true })
  public googleAccountId: string;

  @Column({ type: "jsonb" })
  public settings: string;

  @OneToMany(
    type => Payments,
    payments => payments.user,
  )
  @JoinColumn()
  public payments: Payments;

  @OneToMany(
    type => Progress,
    challengeProgressHistory => challengeProgressHistory.user,
  )
  @JoinColumn()
  public challengeProgressHistory: Progress;

  @OneToMany(
    type => CodeBlob,
    codeBlob => codeBlob.user,
  )
  @JoinColumn()
  public challengeCodeHistory: CodeBlob;

  @OneToMany(
    type => Feedback,
    userFeedback => userFeedback.user,
  )
  @JoinColumn()
  public userFeedback: Feedback;

  @CreateDateColumn({ type: "timestamp" })
  public createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  public updatedAt: Date;
}
