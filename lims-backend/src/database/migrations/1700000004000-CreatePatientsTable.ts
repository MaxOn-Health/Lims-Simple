import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';
import { Gender } from '../../modules/patients/constants/gender.enum';

export class CreatePatientsTable1700000004000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create ENUM type for Gender (if not exists)
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE gender_enum AS ENUM ('${Gender.MALE}', '${Gender.FEMALE}', '${Gender.OTHER}');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.createTable(
      new Table({
        name: 'patients',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'patient_id',
            type: 'varchar',
            length: '50',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'age',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'gender',
            type: 'enum',
            enum: Object.values(Gender),
            isNullable: false,
          },
          {
            name: 'contact_number',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'employee_id',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'company_name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'address',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'patients',
      new TableIndex({
        name: 'IDX_patients_patient_id',
        columnNames: ['patient_id'],
      }),
    );

    await queryRunner.createIndex(
      'patients',
      new TableIndex({
        name: 'IDX_patients_contact_number',
        columnNames: ['contact_number'],
      }),
    );

    await queryRunner.createIndex(
      'patients',
      new TableIndex({
        name: 'IDX_patients_employee_id',
        columnNames: ['employee_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('patients');
    await queryRunner.query(`DROP TYPE gender_enum`);
  }
}

