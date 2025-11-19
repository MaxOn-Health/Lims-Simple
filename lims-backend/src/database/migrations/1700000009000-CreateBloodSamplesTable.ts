import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
  TableUnique,
} from 'typeorm';
import { BloodSampleStatus } from '../../modules/blood-samples/constants/blood-sample-status.enum';

export class CreateBloodSamplesTable1700000009000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type for blood_sample_status
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE blood_sample_status_enum AS ENUM ('COLLECTED', 'IN_LAB', 'TESTED', 'COMPLETED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.createTable(
      new Table({
        name: 'blood_samples',
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
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'sample_id',
            type: 'varchar',
            length: '50',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'passcode_hash',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'collected_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'collected_by',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'blood_sample_status_enum',
            default: "'COLLECTED'",
            isNullable: false,
          },
          {
            name: 'tested_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'tested_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'assignment_id',
            type: 'uuid',
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

    // Add unique constraint on sample_id
    await queryRunner.createUniqueConstraint(
      'blood_samples',
      new TableUnique({
        name: 'UQ_blood_samples_sample_id',
        columnNames: ['sample_id'],
      }),
    );

    // Add foreign keys
    await queryRunner.createForeignKey(
      'blood_samples',
      new TableForeignKey({
        columnNames: ['patient_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'patients',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'blood_samples',
      new TableForeignKey({
        columnNames: ['collected_by'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'RESTRICT',
      }),
    );

    await queryRunner.createForeignKey(
      'blood_samples',
      new TableForeignKey({
        columnNames: ['tested_by'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'blood_samples',
      new TableForeignKey({
        columnNames: ['assignment_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'assignments',
        onDelete: 'RESTRICT',
      }),
    );

    // Add indexes
    await queryRunner.createIndex(
      'blood_samples',
      new TableIndex({
        name: 'IDX_blood_samples_sample_id',
        columnNames: ['sample_id'],
      }),
    );

    await queryRunner.createIndex(
      'blood_samples',
      new TableIndex({
        name: 'IDX_blood_samples_patient_id',
        columnNames: ['patient_id'],
      }),
    );

    await queryRunner.createIndex(
      'blood_samples',
      new TableIndex({
        name: 'IDX_blood_samples_collected_by',
        columnNames: ['collected_by'],
      }),
    );

    await queryRunner.createIndex(
      'blood_samples',
      new TableIndex({
        name: 'IDX_blood_samples_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'blood_samples',
      new TableIndex({
        name: 'IDX_blood_samples_tested_by',
        columnNames: ['tested_by'],
      }),
    );

    await queryRunner.createIndex(
      'blood_samples',
      new TableIndex({
        name: 'IDX_blood_samples_assignment_id',
        columnNames: ['assignment_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('blood_samples');
    await queryRunner.query(`DROP TYPE IF EXISTS blood_sample_status_enum;`);
  }
}

