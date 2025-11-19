import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
  TableColumn,
} from 'typeorm';
import { ProjectStatus } from '../../modules/projects/constants/project-status.enum';

export class CreateProjectsTable1700000014000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type for project_status
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE project_status_enum AS ENUM ('${ProjectStatus.ACTIVE}', '${ProjectStatus.COMPLETED}', '${ProjectStatus.CANCELLED}', '${ProjectStatus.SCHEDULED}');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create projects table
    await queryRunner.createTable(
      new Table({
        name: 'projects',
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
            length: '100',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'description',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'company_name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'contact_person',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'contact_number',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'contact_email',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'camp_date',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'camp_location',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'camp_settings',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'patient_count',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'total_revenue',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
            isNullable: false,
          },
          {
            name: 'status',
            type: 'project_status_enum',
            default: `'${ProjectStatus.ACTIVE}'`,
            isNullable: false,
          },
          {
            name: 'notes',
            type: 'text',
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
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Add indexes
    await queryRunner.createIndex(
      'projects',
      new TableIndex({
        name: 'IDX_projects_name',
        columnNames: ['name'],
      }),
    );

    await queryRunner.createIndex(
      'projects',
      new TableIndex({
        name: 'IDX_projects_status',
        columnNames: ['status'],
      }),
    );

    // Add project_id column to patients table
    await queryRunner.addColumn(
      'patients',
      new TableColumn({
        name: 'project_id',
        type: 'uuid',
        isNullable: true,
      }),
    );

    // Add foreign key constraint
    await queryRunner.createForeignKey(
      'patients',
      new TableForeignKey({
        columnNames: ['project_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'projects',
        onDelete: 'SET NULL',
      }),
    );

    // Add index on project_id
    await queryRunner.createIndex(
      'patients',
      new TableIndex({
        name: 'IDX_patients_project_id',
        columnNames: ['project_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key and index on patients table
    const table = await queryRunner.getTable('patients');
    const foreignKey = table?.foreignKeys.find((fk) => fk.columnNames.indexOf('project_id') !== -1);
    if (foreignKey) {
      await queryRunner.dropForeignKey('patients', foreignKey);
    }

    const projectIdIndex = table?.indices.find((idx) => idx.name === 'IDX_patients_project_id');
    if (projectIdIndex) {
      await queryRunner.dropIndex('patients', projectIdIndex);
    }

    // Drop column from patients table
    await queryRunner.dropColumn('patients', 'project_id');

    // Drop projects table
    await queryRunner.dropTable('projects');

    // Drop enum type
    await queryRunner.query(`DROP TYPE IF EXISTS project_status_enum;`);
  }
}

