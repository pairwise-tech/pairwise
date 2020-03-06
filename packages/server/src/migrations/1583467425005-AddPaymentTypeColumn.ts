import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPaymentTypeColumn1583467425005 implements MigrationInterface {
  name = "AddPaymentTypeColumn1583467425005";

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "payments" ADD "paymentType" character varying NOT NULL`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "payments" DROP COLUMN "paymentType"`,
      undefined,
    );
  }
}
