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

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  uuid: string;

  @Column({ unique: true })
  email: string;

  @Column()
  displayName: string;

  @Column()
  givenName: string;

  @Column()
  familyName: string;

  @Column()
  lastActiveChallengeId: string;

  @Column()
  avatarUrl: string;

  @OneToMany(
    type => Payments,
    payments => payments.user,
  )
  @JoinColumn()
  payments: Payments;

  @OneToMany(
    type => Progress,
    challengeProgressHistory => challengeProgressHistory.user,
  )
  @JoinColumn()
  challengeProgressHistory: Progress;

  @OneToMany(
    type => CodeBlob,
    codeBlob => codeBlob.user,
  )
  @JoinColumn()
  challengeCodeHistory: CodeBlob;

  @OneToMany(
    type => Feedback,
    userFeedback => userFeedback.user,
  )
  @JoinColumn()
  userFeedback: Feedback;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;
}
