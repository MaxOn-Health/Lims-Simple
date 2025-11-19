import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateTestsTable1700000002000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum for test category
    await queryRunner.query(`
      CREATE TYPE test_category_enum AS ENUM ('on_site', 'lab')
    `);

    await queryRunner.createTable(
      new Table({
        name: 'tests',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'category',
            type: 'enum',
            enum: ['on_site', 'lab'],
            isNullable: false,
          },
          {
            name: 'admin_role',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'normal_range_min',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'normal_range_max',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'unit',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'test_fields',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
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

    // Create indexes
    await queryRunner.createIndex(
      'tests',
      new TableIndex({
        name: 'IDX_tests_category',
        columnNames: ['category'],
      }),
    );

    await queryRunner.createIndex(
      'tests',
      new TableIndex({
        name: 'IDX_tests_admin_role',
        columnNames: ['admin_role'],
      }),
    );

    await queryRunner.createIndex(
      'tests',
      new TableIndex({
        name: 'IDX_tests_is_active',
        columnNames: ['is_active'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('tests');
    await queryRunner.query(`DROP TYPE IF EXISTS test_category_enum`);
  }
}

