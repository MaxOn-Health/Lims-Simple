import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameTestAdminToTestTechnician1700000015000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Rename column from test_admin_type to test_technician_type
    await queryRunner.query(`
      ALTER TABLE users 
      RENAME COLUMN test_admin_type TO test_technician_type;
    `);

    // Step 2: Rename index if it exists
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_users_test_admin_type";
      CREATE INDEX IF NOT EXISTS "IDX_users_test_technician_type" ON users("test_technician_type");
    `);

    // Step 3: Recreate enum with TEST_TECHNICIAN and update data
    // PostgreSQL doesn't allow using newly added enum values in the same transaction
    // So we need to recreate the entire enum type
    await queryRunner.query(`
      DO $$ 
      DECLARE
        v_enum_name text;
      BEGIN
        -- Find the enum type name for the role column
        SELECT t.typname INTO v_enum_name
        FROM pg_type t 
        JOIN pg_attribute a ON a.atttypid = t.oid
        JOIN pg_class c ON a.attrelid = c.oid
        WHERE c.relname = 'users' 
          AND a.attname = 'role'
          AND t.typtype = 'e';
        
        IF v_enum_name IS NOT NULL THEN
          -- Step 1: Convert column to text temporarily so we can update the data
          EXECUTE format('ALTER TABLE users ALTER COLUMN role TYPE varchar(50) USING role::text');
          
          -- Step 2: Update data in text form (TEST_ADMIN -> TEST_TECHNICIAN)
          UPDATE users 
          SET role = 'TEST_TECHNICIAN'
          WHERE role = 'TEST_ADMIN';
          
          -- Step 3: Create new enum with TEST_TECHNICIAN instead of TEST_ADMIN
          EXECUTE format('CREATE TYPE %I_new AS ENUM (
            ''SUPER_ADMIN'',
            ''RECEPTIONIST'',
            ''TEST_TECHNICIAN'',
            ''LAB_TECHNICIAN'',
            ''DOCTOR''
          )', v_enum_name);
          
          -- Step 4: Change column to use new enum
          EXECUTE format('ALTER TABLE users ALTER COLUMN role TYPE %I_new USING role::%I_new', v_enum_name, v_enum_name);
          
          -- Step 5: Drop old enum
          EXECUTE format('DROP TYPE IF EXISTS %I CASCADE', v_enum_name);
          
          -- Step 6: Rename new enum to original name
          EXECUTE format('ALTER TYPE %I_new RENAME TO %I', v_enum_name, v_enum_name);
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert the changes in reverse order
    
    // Step 1: Revert enum type
    await queryRunner.query(`
      DO $$ 
      DECLARE
        v_enum_name text;
      BEGIN
        -- Find the enum type name
        SELECT t.typname INTO v_enum_name
        FROM pg_type t 
        JOIN pg_attribute a ON a.atttypid = t.oid
        JOIN pg_class c ON a.attrelid = c.oid
        WHERE c.relname = 'users' 
          AND a.attname = 'role'
          AND t.typtype = 'e';
        
        IF v_enum_name IS NOT NULL THEN
          -- Add TEST_ADMIN back
          EXECUTE format('CREATE TYPE %I_old AS ENUM (
            ''SUPER_ADMIN'',
            ''RECEPTIONIST'',
            ''TEST_ADMIN'',
            ''LAB_TECHNICIAN'',
            ''DOCTOR''
          )', v_enum_name);
          
          -- Change column to text then to old enum
          EXECUTE format('ALTER TABLE users ALTER COLUMN role TYPE varchar(50)');
          EXECUTE format('ALTER TABLE users ALTER COLUMN role TYPE %I_old USING role::%I_old', v_enum_name, v_enum_name);
          
          -- Drop current enum
          EXECUTE format('DROP TYPE IF EXISTS %I CASCADE', v_enum_name);
          
          -- Rename old enum back
          EXECUTE format('ALTER TYPE %I_old RENAME TO %I', v_enum_name, v_enum_name);
        END IF;
      END $$;
    `);

    // Step 2: Revert data
    await queryRunner.query(`
      UPDATE users 
      SET role = 'TEST_ADMIN' 
      WHERE role::text = 'TEST_TECHNICIAN';
    `);

    // Step 3: Revert index
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_users_test_technician_type";
      CREATE INDEX IF NOT EXISTS "IDX_users_test_admin_type" ON users("test_admin_type");
    `);

    // Step 4: Revert column name
    await queryRunner.query(`
      ALTER TABLE users 
      RENAME COLUMN test_technician_type TO test_admin_type;
    `);
  }
}

