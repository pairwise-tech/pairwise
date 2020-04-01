import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSingleSignOnAccountIds1585539845235
  implements MigrationInterface {
  name = "AddSingleSignOnAccountIds1585539845235";

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "facebookAccountId" character varying`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "githubAccountId" character varying`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "googleAccountId" character varying`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "email" DROP NOT NULL`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "email" SET NOT NULL`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "googleAccountId"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "githubAccountId"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "facebookAccountId"`,
      undefined,
    );
  }
}
