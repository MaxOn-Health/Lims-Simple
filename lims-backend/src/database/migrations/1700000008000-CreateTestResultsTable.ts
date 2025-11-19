import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
  TableUnique,
} from 'typeorm';

export class CreateTestResultsTable1700000008000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'test_results',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'assignment_id',
            type: 'uuid',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'result_values',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'entered_by',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'entered_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'is_verified',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'verified_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'verified_at',
            type: 'timestamp',
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

    // Add unique constraint on assignment_id
    await queryRunner.createUniqueConstraint(
      'test_results',
      new TableUnique({
        name: 'UQ_test_results_assignment_id',
        columnNames: ['assignment_id'],
      }),
    );

    // Add foreign keys
    await queryRunner.createForeignKey(
      'test_results',
      new TableForeignKey({
        columnNames: ['assignment_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'assignments',
        onDelete: 'RESTRICT',
      }),
    );

    await queryRunner.createForeignKey(
      'test_results',
      new TableForeignKey({
        columnNames: ['entered_by'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'RESTRICT',
      }),
    );

    await queryRunner.createForeignKey(
      'test_results',
      new TableForeignKey({
        columnNames: ['verified_by'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    // Add indexes
    await queryRunner.createIndex(
      'test_results',
      new TableIndex({
        name: 'IDX_test_results_assignment_id',
        columnNames: ['assignment_id'],
      }),
    );

    await queryRunner.createIndex(
      'test_results',
      new TableIndex({
        name: 'IDX_test_results_entered_by',
        columnNames: ['entered_by'],
      }),
    );

    await queryRunner.createIndex(
      'test_results',
      new TableIndex({
        name: 'IDX_test_results_verified_by',
        columnNames: ['verified_by'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('test_results');
  }
}





