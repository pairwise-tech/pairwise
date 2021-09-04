import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeHasCoachingSessionToCoachingSessions1630795831063
  implements MigrationInterface
{
  name = "ChangeHasCoachingSessionToCoachingSessions1630795831063";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" RENAME COLUMN "hasCoachingSession" TO "coachingSessions"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "coachingSessions"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "coachingSessions" integer NOT NULL DEFAULT '0'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "coachingSessions"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "coachingSessions" boolean`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" RENAME COLUMN "coachingSessions" TO "hasCoachingSession"`,
    );
  }
}
