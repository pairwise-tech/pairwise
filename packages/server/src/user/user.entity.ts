import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

/**
 * TODO: Share with client code!
 */
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
}
