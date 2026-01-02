import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAdminRolesTable1735827600000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create admin_roles table
        await queryRunner.query(`
      CREATE TABLE admin_roles (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(50) UNIQUE NOT NULL,
        display_name VARCHAR(100) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

        // Seed existing admin roles
        await queryRunner.query(`
      INSERT INTO admin_roles (name, display_name, description) VALUES
        ('audiometry', 'Audiometry', 'Audiometry hearing tests'),
        ('xray', 'X-Ray', 'X-Ray imaging tests'),
        ('eye_test', 'Eye Test', 'Vision and eye examination tests'),
        ('pft', 'PFT', 'Pulmonary Function Tests'),
        ('ecg', 'ECG', 'Electrocardiogram tests');
    `);

        // Create index for faster lookups
        await queryRunner.query(`
      CREATE INDEX idx_admin_roles_name ON admin_roles(name);
    `);

        await queryRunner.query(`
      CREATE INDEX idx_admin_roles_is_active ON admin_roles(is_active);
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS idx_admin_roles_is_active;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_admin_roles_name;`);
        await queryRunner.query(`DROP TABLE IF EXISTS admin_roles;`);
    }
}
