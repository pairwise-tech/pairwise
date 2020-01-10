import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateInitialTables1578678691369 implements MigrationInterface {
  name = "CreateInitialTables1578678691369";

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `CREATE TABLE "progress" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "courseId" character varying NOT NULL, "progress" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userUuid" uuid, CONSTRAINT "PK_e8d21f274fbaa78449f4b5e3d3d" PRIMARY KEY ("uuid"))`,
      undefined,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cb4d1477194c4ba8cf55bb6eb4" ON "progress" ("courseId") `,
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
      `CREATE TABLE "feedback" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "challengeId" character varying NOT NULL, "feedback" character varying NOT NULL, "type" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userUuid" uuid, CONSTRAINT "PK_79fbf282194c68837c19d58fb7a" PRIMARY KEY ("uuid"))`,
      undefined,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_53a7d1f55a82cc79b0cb48c0be" ON "feedback" ("challengeId") `,
      undefined,
    );
    await queryRunner.query(
      `CREATE TABLE "user" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "displayName" character varying NOT NULL, "givenName" character varying NOT NULL, "familyName" character varying NOT NULL, "lastActiveChallengeId" character varying, "profileImageUrl" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_a95e949168be7b7ece1a2382fed" PRIMARY KEY ("uuid"))`,
      undefined,
    );
    await queryRunner.query(
      `CREATE TABLE "code_blob" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "challengeId" character varying NOT NULL, "dataBlob" jsonb NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userUuid" uuid, CONSTRAINT "PK_d28b37881b30b8e822f1f7943da" PRIMARY KEY ("uuid"))`,
      undefined,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_45890c0ce96a24f23702b25569" ON "code_blob" ("challengeId") `,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "progress" ADD CONSTRAINT "FK_a8275b9343d2461a743476943cd" FOREIGN KEY ("userUuid") REFERENCES "user"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_3876d75b52f18e543c7aa2a3c5d" FOREIGN KEY ("userUuid") REFERENCES "user"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "feedback" ADD CONSTRAINT "FK_9e510c65847ccd21e2ac3c49672" FOREIGN KEY ("userUuid") REFERENCES "user"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "code_blob" ADD CONSTRAINT "FK_2c9fe198397d0e2d0a827445c03" FOREIGN KEY ("userUuid") REFERENCES "user"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "code_blob" DROP CONSTRAINT "FK_2c9fe198397d0e2d0a827445c03"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "feedback" DROP CONSTRAINT "FK_9e510c65847ccd21e2ac3c49672"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_3876d75b52f18e543c7aa2a3c5d"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "progress" DROP CONSTRAINT "FK_a8275b9343d2461a743476943cd"`,
      undefined,
    );
    await queryRunner.query(
      `DROP INDEX "IDX_45890c0ce96a24f23702b25569"`,
      undefined,
    );
    await queryRunner.query(`DROP TABLE "code_blob"`, undefined);
    await queryRunner.query(`DROP TABLE "user"`, undefined);
    await queryRunner.query(
      `DROP INDEX "IDX_53a7d1f55a82cc79b0cb48c0be"`,
      undefined,
    );
    await queryRunner.query(`DROP TABLE "feedback"`, undefined);
    await queryRunner.query(
      `DROP INDEX "IDX_00097d3b3147848e3585aabb43"`,
      undefined,
    );
    await queryRunner.query(`DROP TABLE "payments"`, undefined);
    await queryRunner.query(
      `DROP INDEX "IDX_cb4d1477194c4ba8cf55bb6eb4"`,
      undefined,
    );
    await queryRunner.query(`DROP TABLE "progress"`, undefined);
  }
}
