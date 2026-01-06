import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPinHashToUsers1736145600000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE users ADD COLUMN pin_hash VARCHAR(255) NULL;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE users DROP COLUMN pin_hash;
        `);
    }
}
