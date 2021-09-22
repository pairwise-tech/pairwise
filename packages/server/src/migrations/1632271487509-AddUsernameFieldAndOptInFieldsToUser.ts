import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUsernameFieldAndOptInFieldsToUser1632271487509
  implements MigrationInterface
{
  name = "AddUsernameFieldAndOptInFieldsToUser1632271487509";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "displayName"`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD "username" character varying NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "optInPublicProfile" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "optInShareAnonymousGeolocationActivity" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "optInShareAnonymousGeolocationActivity"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "optInPublicProfile"`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "username"`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD "displayName" character varying NOT NULL`,
    );
  }
}
