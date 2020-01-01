import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { UserCourseProgressEntity } from "src/progress/userCourseProgress.entity";
import { UserCodeBlobEntity } from "src/progress/userCodeBlob.entity";
import { PaymentsEntity } from "src/payments/payments.entity";

@Entity()
export class UserEntity {
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

  @OneToMany(
    type => PaymentsEntity,
    payments => payments.user,
  )
  @JoinColumn()
  payments: PaymentsEntity;

  @OneToMany(
    type => UserCourseProgressEntity,
    challengeProgressHistory => challengeProgressHistory.user,
  )
  @JoinColumn()
  challengeProgressHistory: UserCourseProgressEntity;

  @OneToMany(
    type => UserCodeBlobEntity,
    userCodeHistory => userCodeHistory.user,
  )
  @JoinColumn()
  challengeCodeHistory: UserCodeBlobEntity;
}
