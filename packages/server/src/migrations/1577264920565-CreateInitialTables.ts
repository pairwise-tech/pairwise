import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateInitialTables1577264920565 implements MigrationInterface {
  name = "CreateInitialTables1577264920565";

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `CREATE TABLE "user_course_progress" ("id" SERIAL NOT NULL, "courseId" character varying NOT NULL, "progress" jsonb, "userId" integer, CONSTRAINT "PK_3378f7ec046e4aa16d39fd88f00" PRIMARY KEY ("id"))`,
      undefined,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f67dfbdc42643337b648774f52" ON "user_course_progress" ("courseId") `,
      undefined,
    );
    await queryRunner.query(
      `CREATE TABLE "user" ("id" SERIAL NOT NULL, "email" character varying NOT NULL, "displayName" character varying NOT NULL, "givenName" character varying NOT NULL, "familyName" character varying NOT NULL, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
      undefined,
    );
    await queryRunner.query(
      `CREATE TABLE "user_code_blob" ("id" SERIAL NOT NULL, "challengeId" character varying NOT NULL, "dataBlob" jsonb NOT NULL, "userId" integer, CONSTRAINT "PK_cedbd9ec812f9871e8c91e48a2a" PRIMARY KEY ("id"))`,
      undefined,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1c42ae72a4283d6118664971d5" ON "user_code_blob" ("challengeId") `,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "user_course_progress" ADD CONSTRAINT "FK_4363dd5291e9a361c338348362d" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "user_code_blob" ADD CONSTRAINT "FK_4ebabdee70e486382ddd763a91f" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "user_code_blob" DROP CONSTRAINT "FK_4ebabdee70e486382ddd763a91f"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "user_course_progress" DROP CONSTRAINT "FK_4363dd5291e9a361c338348362d"`,
      undefined,
    );
    await queryRunner.query(
      `DROP INDEX "IDX_1c42ae72a4283d6118664971d5"`,
      undefined,
    );
    await queryRunner.query(`DROP TABLE "user_code_blob"`, undefined);
    await queryRunner.query(`DROP TABLE "user"`, undefined);
    await queryRunner.query(
      `DROP INDEX "IDX_f67dfbdc42643337b648774f52"`,
      undefined,
    );
    await queryRunner.query(`DROP TABLE "user_course_progress"`, undefined);
  }
}
