import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { UserCourseProgress } from "src/progress/userCourseProgress.entity";
import { UserCodeBlob } from "src/progress/userCodeBlob.entity";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  displayName: string;

  @Column()
  givenName: string;

  @Column()
  familyName: string;

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
}
