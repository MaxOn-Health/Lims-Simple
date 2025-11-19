import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex, TableUnique } from 'typeorm';
import { AssignmentStatus } from '../../modules/assignments/constants/assignment-status.enum';

export class CreateAssignmentsTable1700000007000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type for assignment_status
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE assignments_status_enum AS ENUM ('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'SUBMITTED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.createTable(
      new Table({
        name: 'assignments',
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
            name: 'test_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'admin_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'assignments_status_enum',
            default: "'PENDING'",
            isNullable: false,
          },
          {
            name: 'assigned_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'started_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'completed_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'assigned_by',
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

    // Add unique constraint on (patient_id, test_id)
    await queryRunner.createUniqueConstraint(
      'assignments',
      new TableUnique({
        name: 'UQ_assignments_patient_test',
        columnNames: ['patient_id', 'test_id'],
      }),
    );

    // Add foreign keys
    await queryRunner.createForeignKey(
      'assignments',
      new TableForeignKey({
        columnNames: ['patient_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'patients',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'assignments',
      new TableForeignKey({
        columnNames: ['test_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tests',
        onDelete: 'RESTRICT',
      }),
    );

    await queryRunner.createForeignKey(
      'assignments',
      new TableForeignKey({
        columnNames: ['admin_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'RESTRICT',
      }),
    );

    await queryRunner.createForeignKey(
      'assignments',
      new TableForeignKey({
        columnNames: ['assigned_by'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    // Add indexes
    await queryRunner.createIndex(
      'assignments',
      new TableIndex({
        name: 'IDX_assignments_patient_id',
        columnNames: ['patient_id'],
      }),
    );

    await queryRunner.createIndex(
      'assignments',
      new TableIndex({
        name: 'IDX_assignments_test_id',
        columnNames: ['test_id'],
      }),
    );

    await queryRunner.createIndex(
      'assignments',
      new TableIndex({
        name: 'IDX_assignments_admin_id',
        columnNames: ['admin_id'],
      }),
    );

    await queryRunner.createIndex(
      'assignments',
      new TableIndex({
        name: 'IDX_assignments_status',
        columnNames: ['status'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('assignments');
    await queryRunner.query(`DROP TYPE IF EXISTS assignments_status_enum;`);
  }
}

