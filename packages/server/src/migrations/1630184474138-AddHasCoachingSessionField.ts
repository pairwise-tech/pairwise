import { MigrationInterface, QueryRunner } from "typeorm";

export class AddHasCoachingSessionField1630184474138
  implements MigrationInterface
{
  name = "AddHasCoachingSessionField1630184474138";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "hasCoachingSession" boolean`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "hasCoachingSession"`,
    );
  }
}
