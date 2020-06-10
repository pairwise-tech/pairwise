import { MigrationInterface, QueryRunner } from "typeorm";

export class MigrateToLastActiveChallengeIds1591537888973
  implements MigrationInterface {
  name = "MigrateToLastActiveChallengeIds1591537888973";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" RENAME COLUMN "lastActiveChallengeId" TO "lastActiveChallengeIds"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "lastActiveChallengeIds"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "lastActiveChallengeIds" jsonb NOT NULL DEFAULT '"{}"'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "lastActiveChallengeIds"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "lastActiveChallengeIds" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" RENAME COLUMN "lastActiveChallengeIds" TO "lastActiveChallengeId"`,
    );
  }
}
