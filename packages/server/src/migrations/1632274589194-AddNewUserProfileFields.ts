import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNewUserProfileFields1632274589194
  implements MigrationInterface
{
  name = "AddNewUserProfileFields1632274589194";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "displayName"`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD "username" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb" UNIQUE ("username")`,
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
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb"`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "username"`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD "displayName" character varying NOT NULL`,
    );
  }
}
