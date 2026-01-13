import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddResultEditTracking1737000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE test_results ADD COLUMN is_edited BOOLEAN NOT NULL DEFAULT FALSE;
        `);
        await queryRunner.query(`
            ALTER TABLE test_results ADD COLUMN edited_at TIMESTAMP NULL;
        `);
        await queryRunner.query(`
            ALTER TABLE test_results ADD COLUMN edited_by UUID NULL;
        `);
        await queryRunner.query(`
            ALTER TABLE test_results ADD COLUMN edit_reason TEXT NULL;
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS IDX_test_results_edited_by ON test_results (edited_by);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX IF EXISTS IDX_test_results_edited_by;
        `);
        await queryRunner.query(`
            ALTER TABLE test_results DROP COLUMN edit_reason;
        `);
        await queryRunner.query(`
            ALTER TABLE test_results DROP COLUMN edited_by;
        `);
        await queryRunner.query(`
            ALTER TABLE test_results DROP COLUMN edited_at;
        `);
        await queryRunner.query(`
            ALTER TABLE test_results DROP COLUMN is_edited;
        `);
    }
}
