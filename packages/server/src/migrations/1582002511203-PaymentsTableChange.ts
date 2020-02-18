import { MigrationInterface, QueryRunner } from "typeorm";

export class PaymentsTableChange1582002511203 implements MigrationInterface {
  name = "PaymentsTableChange1582002511203";

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "payments" RENAME COLUMN "type" TO "status"`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "payments" RENAME COLUMN "status" TO "type"`,
      undefined,
    );
  }
}
