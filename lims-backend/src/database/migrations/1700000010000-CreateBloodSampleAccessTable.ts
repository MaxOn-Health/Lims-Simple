import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateBloodSampleAccessTable1700000010000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'blood_sample_access',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'sample_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'accessed_by',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'accessed_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Add foreign keys
    await queryRunner.createForeignKey(
      'blood_sample_access',
      new TableForeignKey({
        columnNames: ['sample_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'blood_samples',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'blood_sample_access',
      new TableForeignKey({
        columnNames: ['accessed_by'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'RESTRICT',
      }),
    );

    // Add indexes
    await queryRunner.createIndex(
      'blood_sample_access',
      new TableIndex({
        name: 'IDX_blood_sample_access_sample_id',
        columnNames: ['sample_id'],
      }),
    );

    await queryRunner.createIndex(
      'blood_sample_access',
      new TableIndex({
        name: 'IDX_blood_sample_access_accessed_by',
        columnNames: ['accessed_by'],
      }),
    );

    await queryRunner.createIndex(
      'blood_sample_access',
      new TableIndex({
        name: 'IDX_blood_sample_access_accessed_at',
        columnNames: ['accessed_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('blood_sample_access');
  }
}





