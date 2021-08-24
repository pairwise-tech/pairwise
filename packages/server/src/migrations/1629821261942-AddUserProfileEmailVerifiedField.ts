import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserProfileEmailVerifiedField1629821261942
  implements MigrationInterface
{
  name = "AddUserProfileEmailVerifiedField1629821261942";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ADD "emailVerified" boolean`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "emailVerified"`);
  }
}
