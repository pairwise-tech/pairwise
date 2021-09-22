import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Progress } from "../progress/progress.entity";
import { Payments } from "../payments/payments.entity";
import { Feedback } from "../feedback/feedback.entity";
import { CodeBlob } from "../blob/blob.entity";

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

  @Column({ unique: true, nullable: true })
  public email: string;

  @Column({ nullable: true })
  public emailVerified: boolean | null;

  @Column({ default: null, unique: true })
  public username: string | null;

  @Column()
  public givenName: string;

  @Column()
  public familyName: string;

  @Column()
  public avatarUrl: string;

  @Column({ nullable: true })
  public facebookAccountId: string;

  @Column({ nullable: true })
  public githubAccountId: string;

  @Column({ nullable: true })
  public googleAccountId: string;

  @Column({ default: 0 })
  public coachingSessions: number;

  @Column({ default: false })
  public optInPublicProfile: boolean;

  @Column({ default: false })
  public optInShareAnonymousGeolocationActivity: boolean;

  @Column({ type: "jsonb" })
  public settings: string;

  @Column({ type: "jsonb", default: `"{}"` })
  public lastActiveChallengeIds: string;

  @OneToMany((type) => Payments, (payments) => payments.user)
  @JoinColumn()
  public payments: Payments;

  @OneToMany(
    (type) => Progress,
    (challengeProgressHistory) => challengeProgressHistory.user,
  )
  @JoinColumn()
  public challengeProgressHistory: Progress[];

  @OneToMany((type) => CodeBlob, (codeBlob) => codeBlob.user)
  @JoinColumn()
  public challengeCodeHistory: CodeBlob;

  @OneToMany((type) => Feedback, (userFeedback) => userFeedback.user)
  @JoinColumn()
  public userFeedback: Feedback;

  @CreateDateColumn({ type: "timestamp" })
  public createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  public updatedAt: Date;
}
