import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey, TableUnique } from 'typeorm';

export class CreateReportsTable1700000012000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type for report_status
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE report_status_enum AS ENUM ('PENDING', 'GENERATING', 'COMPLETED', 'FAILED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.createTable(
      new Table({
        name: 'reports',
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
            name: 'report_number',
            type: 'varchar',
            length: '50',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'doctor_review_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'report_status_enum',
            default: "'PENDING'",
            isNullable: false,
          },
          {
            name: 'pdf_url',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'generated_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'generated_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Add foreign keys
    await queryRunner.createForeignKey(
      'reports',
      new TableForeignKey({
        columnNames: ['patient_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'patients',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'reports',
      new TableForeignKey({
        columnNames: ['doctor_review_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'doctor_reviews',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'reports',
      new TableForeignKey({
        columnNames: ['generated_by'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    // Add indexes
    await queryRunner.createIndex(
      'reports',
      new TableIndex({
        name: 'IDX_reports_report_number',
        columnNames: ['report_number'],
      }),
    );

    await queryRunner.createIndex(
      'reports',
      new TableIndex({
        name: 'IDX_reports_patient_id',
        columnNames: ['patient_id'],
      }),
    );

    await queryRunner.createIndex(
      'reports',
      new TableIndex({
        name: 'IDX_reports_status',
        columnNames: ['status'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('reports');
    await queryRunner.query(`DROP TYPE IF EXISTS report_status_enum;`);
  }
}






