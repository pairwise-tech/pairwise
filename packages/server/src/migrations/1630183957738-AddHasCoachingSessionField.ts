import { MigrationInterface, QueryRunner } from "typeorm";

export class AddHasCoachingSessionField1630183957738
  implements MigrationInterface
{
  name = "AddHasCoachingSessionField1630183957738";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "progress" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "courseId" character varying NOT NULL, "progress" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userUuid" uuid, CONSTRAINT "PK_e8d21f274fbaa78449f4b5e3d3d" PRIMARY KEY ("uuid"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cb4d1477194c4ba8cf55bb6eb4" ON "progress" ("courseId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "payments" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "courseId" character varying NOT NULL, "datePaid" TIMESTAMP NOT NULL, "amountPaid" integer NOT NULL, "status" character varying NOT NULL, "paymentType" character varying NOT NULL, "extraData" json, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userUuid" uuid, CONSTRAINT "PK_2c540326a039a91fa7e942caed7" PRIMARY KEY ("uuid"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_00097d3b3147848e3585aabb43" ON "payments" ("courseId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "feedback" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "challengeId" character varying NOT NULL, "feedback" character varying NOT NULL, "type" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userUuid" uuid, CONSTRAINT "PK_79fbf282194c68837c19d58fb7a" PRIMARY KEY ("uuid"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_53a7d1f55a82cc79b0cb48c0be" ON "feedback" ("challengeId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "user" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying, "emailVerified" boolean NOT NULL, "displayName" character varying NOT NULL, "givenName" character varying NOT NULL, "familyName" character varying NOT NULL, "avatarUrl" character varying NOT NULL, "facebookAccountId" character varying, "githubAccountId" character varying, "googleAccountId" character varying, "hasCoachingSession" boolean NOT NULL, "settings" jsonb NOT NULL, "lastActiveChallengeIds" jsonb NOT NULL DEFAULT '"{}"', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_a95e949168be7b7ece1a2382fed" PRIMARY KEY ("uuid"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "code_blob" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "challengeId" character varying NOT NULL, "dataBlob" jsonb NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userUuid" uuid, CONSTRAINT "PK_d28b37881b30b8e822f1f7943da" PRIMARY KEY ("uuid"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_45890c0ce96a24f23702b25569" ON "code_blob" ("challengeId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "challenge_meta" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "challengeId" character varying NOT NULL, "numberOfTimesCompleted" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6358562864ec5b146a438ae28a5" PRIMARY KEY ("uuid"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c57d21ad292aea7c64648cec87" ON "challenge_meta" ("challengeId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "progress" ADD CONSTRAINT "FK_a8275b9343d2461a743476943cd" FOREIGN KEY ("userUuid") REFERENCES "user"("uuid") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_3876d75b52f18e543c7aa2a3c5d" FOREIGN KEY ("userUuid") REFERENCES "user"("uuid") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "feedback" ADD CONSTRAINT "FK_9e510c65847ccd21e2ac3c49672" FOREIGN KEY ("userUuid") REFERENCES "user"("uuid") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "code_blob" ADD CONSTRAINT "FK_2c9fe198397d0e2d0a827445c03" FOREIGN KEY ("userUuid") REFERENCES "user"("uuid") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "code_blob" DROP CONSTRAINT "FK_2c9fe198397d0e2d0a827445c03"`,
    );
    await queryRunner.query(
      `ALTER TABLE "feedback" DROP CONSTRAINT "FK_9e510c65847ccd21e2ac3c49672"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_3876d75b52f18e543c7aa2a3c5d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "progress" DROP CONSTRAINT "FK_a8275b9343d2461a743476943cd"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_c57d21ad292aea7c64648cec87"`);
    await queryRunner.query(`DROP TABLE "challenge_meta"`);
    await queryRunner.query(`DROP INDEX "IDX_45890c0ce96a24f23702b25569"`);
    await queryRunner.query(`DROP TABLE "code_blob"`);
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP INDEX "IDX_53a7d1f55a82cc79b0cb48c0be"`);
    await queryRunner.query(`DROP TABLE "feedback"`);
    await queryRunner.query(`DROP INDEX "IDX_00097d3b3147848e3585aabb43"`);
    await queryRunner.query(`DROP TABLE "payments"`);
    await queryRunner.query(`DROP INDEX "IDX_cb4d1477194c4ba8cf55bb6eb4"`);
    await queryRunner.query(`DROP TABLE "progress"`);
  }
}
