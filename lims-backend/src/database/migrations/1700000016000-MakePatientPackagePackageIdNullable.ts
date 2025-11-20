import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakePatientPackagePackageIdNullable1700000016000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Find and drop the foreign key constraint first
    const constraintResult = await queryRunner.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'patient_packages'
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name IN (
          SELECT constraint_name
          FROM information_schema.key_column_usage
          WHERE table_name = 'patient_packages'
            AND column_name = 'package_id'
        );
    `);

    if (constraintResult && constraintResult.length > 0) {
      const constraintName = constraintResult[0].constraint_name;
      await queryRunner.query(`
        ALTER TABLE "patient_packages"
        DROP CONSTRAINT IF EXISTS "${constraintName}";
      `);
    }

    // Make package_id nullable
    await queryRunner.query(`
      ALTER TABLE "patient_packages"
      ALTER COLUMN "package_id" DROP NOT NULL;
    `);

    // Recreate the foreign key constraint with nullable support
    // TypeORM will handle this automatically, but we add it explicitly for safety
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.table_constraints
          WHERE table_name = 'patient_packages'
            AND constraint_type = 'FOREIGN KEY'
            AND constraint_name LIKE '%package_id%'
        ) THEN
          ALTER TABLE "patient_packages"
          ADD CONSTRAINT "FK_patient_packages_package_id"
          FOREIGN KEY ("package_id")
          REFERENCES "packages"("id")
          ON DELETE RESTRICT;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // First, we need to handle any null values
    // For rollback, we'll need to set package_id for any null records
    // This is a safety check - in practice, you might want to handle this differently
    await queryRunner.query(`
      UPDATE "patient_packages"
      SET "package_id" = (
        SELECT id FROM "packages" LIMIT 1
      )
      WHERE "package_id" IS NULL;
    `);

    // Drop the foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "patient_packages"
      DROP CONSTRAINT IF EXISTS "FK_patient_packages_package_id";
    `);

    // Make package_id NOT NULL again
    await queryRunner.query(`
      ALTER TABLE "patient_packages"
      ALTER COLUMN "package_id" SET NOT NULL;
    `);

    // Recreate the foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "patient_packages"
      ADD CONSTRAINT "FK_patient_packages_package_id"
      FOREIGN KEY ("package_id")
      REFERENCES "packages"("id")
      ON DELETE RESTRICT
      ON UPDATE CASCADE;
    `);
  }
}

