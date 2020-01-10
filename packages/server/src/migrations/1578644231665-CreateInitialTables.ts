import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateInitialTables1578644231665 implements MigrationInterface {
  name = "CreateInitialTables1578644231665";

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `CREATE TABLE "user_course_progress" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "courseId" character varying NOT NULL, "progress" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userUuid" uuid, CONSTRAINT "PK_8f4d46794143bfe45f3ba7a4abc" PRIMARY KEY ("uuid"))`,
      undefined,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f67dfbdc42643337b648774f52" ON "user_course_progress" ("courseId") `,
      undefined,
    );
    await queryRunner.query(
      `CREATE TABLE "user_code_blob" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "challengeId" character varying NOT NULL, "dataBlob" jsonb NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userUuid" uuid, CONSTRAINT "PK_abde5d0a5fc75d288c791eca3b2" PRIMARY KEY ("uuid"))`,
      undefined,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1c42ae72a4283d6118664971d5" ON "user_code_blob" ("challengeId") `,
      undefined,
    );
    await queryRunner.query(
      `CREATE TABLE "user" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "displayName" character varying NOT NULL, "givenName" character varying NOT NULL, "familyName" character varying NOT NULL, "lastActiveChallengeId" character varying, "profileImageUrl" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_a95e949168be7b7ece1a2382fed" PRIMARY KEY ("uuid"))`,
      undefined,
    );
    await queryRunner.query(
      `CREATE TABLE "payments" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "courseId" character varying NOT NULL, "datePaid" TIMESTAMP NOT NULL, "amountPaid" integer NOT NULL, "type" character varying NOT NULL, "extraData" json, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userUuid" uuid, CONSTRAINT "PK_2c540326a039a91fa7e942caed7" PRIMARY KEY ("uuid"))`,
      undefined,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_00097d3b3147848e3585aabb43" ON "payments" ("courseId") `,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "user_course_progress" ADD CONSTRAINT "FK_6017c40b47161a78980020969c9" FOREIGN KEY ("userUuid") REFERENCES "user"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "user_code_blob" ADD CONSTRAINT "FK_73f028ad8bc4e3cf9b1785fa71e" FOREIGN KEY ("userUuid") REFERENCES "user"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_3876d75b52f18e543c7aa2a3c5d" FOREIGN KEY ("userUuid") REFERENCES "user"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_3876d75b52f18e543c7aa2a3c5d"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "user_code_blob" DROP CONSTRAINT "FK_73f028ad8bc4e3cf9b1785fa71e"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "user_course_progress" DROP CONSTRAINT "FK_6017c40b47161a78980020969c9"`,
      undefined,
    );
    await queryRunner.query(
      `DROP INDEX "IDX_00097d3b3147848e3585aabb43"`,
      undefined,
    );
    await queryRunner.query(`DROP TABLE "payments"`, undefined);
    await queryRunner.query(`DROP TABLE "user"`, undefined);
    await queryRunner.query(
      `DROP INDEX "IDX_1c42ae72a4283d6118664971d5"`,
      undefined,
    );
    await queryRunner.query(`DROP TABLE "user_code_blob"`, undefined);
    await queryRunner.query(
      `DROP INDEX "IDX_f67dfbdc42643337b648774f52"`,
      undefined,
    );
    await queryRunner.query(`DROP TABLE "user_course_progress"`, undefined);
  }
}
