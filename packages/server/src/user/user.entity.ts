import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { UserCourseProgress } from "src/progress/userCourseProgress.entity";
import { UserCodeBlob } from "src/progress/userCodeBlob.entity";
import { Payments } from "src/payments/payments.entity";

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

  @Column({ nullable: true })
  lastActiveChallengeId: string;

  @Column({ nullable: true })
  profileImageUrl: string;

  @OneToMany(
    type => Payments,
    payments => payments.user,
  )
  @JoinColumn()
  payments: Payments;

  @OneToMany(
    type => UserCourseProgress,
    challengeProgressHistory => challengeProgressHistory.user,
  )
  @JoinColumn()
  challengeProgressHistory: UserCourseProgress;

  @OneToMany(
    type => UserCodeBlob,
    userCodeHistory => userCodeHistory.user,
  )
  @JoinColumn()
  challengeCodeHistory: UserCodeBlob;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;
}
