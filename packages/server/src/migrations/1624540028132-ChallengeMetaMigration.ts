import {MigrationInterface, QueryRunner} from "typeorm";

export class ChallengeMetaMigration1624540028132 implements MigrationInterface {
    name = 'ChallengeMetaMigration1624540028132'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "challenge_meta" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "challengeId" character varying NOT NULL, "numberOfTimesCompleted" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6358562864ec5b146a438ae28a5" PRIMARY KEY ("uuid"))`);
        await queryRunner.query(`CREATE INDEX "IDX_c57d21ad292aea7c64648cec87" ON "challenge_meta" ("challengeId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_c57d21ad292aea7c64648cec87"`);
        await queryRunner.query(`DROP TABLE "challenge_meta"`);
    }

}
