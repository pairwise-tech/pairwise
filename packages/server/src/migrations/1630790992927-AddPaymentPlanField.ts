import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPaymentPlanField1630790992927 implements MigrationInterface {
  name = "AddPaymentPlanField1630790992927";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payments" ADD "plan" character varying`,
    );
    await queryRunner.query(`UPDATE "payments" SET "plan"='REGULAR'`);
    await queryRunner.query(
      `ALTER TABLE "payments" ALTER COLUMN "plan" SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "plan"`);
  }
}
