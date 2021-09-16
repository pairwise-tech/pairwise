import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAttemptedChallengeColumn1631806170398
  implements MigrationInterface
{
  name = "AddAttemptedChallengeColumn1631806170398";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "challenge_meta" ADD "numberOfTimesAttempted" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "challenge_meta" ALTER COLUMN "numberOfTimesCompleted" SET DEFAULT '0'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "challenge_meta" ALTER COLUMN "numberOfTimesCompleted" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "challenge_meta" DROP COLUMN "numberOfTimesAttempted"`,
    );
  }
}
