import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreatePackageTestsTable1700000003000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'package_tests',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'package_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'test_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'test_price',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create unique constraint on (package_id, test_id)
    await queryRunner.createIndex(
      'package_tests',
      new TableIndex({
        name: 'IDX_package_tests_unique',
        columnNames: ['package_id', 'test_id'],
        isUnique: true,
      }),
    );

    // Create indexes
    await queryRunner.createIndex(
      'package_tests',
      new TableIndex({
        name: 'IDX_package_tests_package_id',
        columnNames: ['package_id'],
      }),
    );

    await queryRunner.createIndex(
      'package_tests',
      new TableIndex({
        name: 'IDX_package_tests_test_id',
        columnNames: ['test_id'],
      }),
    );

    // Create foreign keys
    await queryRunner.createForeignKey(
      'package_tests',
      new TableForeignKey({
        columnNames: ['package_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'packages',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'package_tests',
      new TableForeignKey({
        columnNames: ['test_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tests',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('package_tests');
    if (table) {
      const foreignKeys = table.foreignKeys;
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey('package_tests', fk);
      }
    }
    await queryRunner.dropTable('package_tests');
  }
}

