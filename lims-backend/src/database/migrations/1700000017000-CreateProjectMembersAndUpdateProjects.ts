import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateProjectMembersAndUpdateProjects1700000017000
    implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Step 1: Create project_members table
        await queryRunner.createTable(
            new Table({
                name: 'project_members',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'project_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'user_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'role_in_project',
                        type: 'varchar',
                        length: '50',
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

        // Step 2: Add unique constraint (project_id, user_id)
        await queryRunner.createIndex(
            'project_members',
            new TableIndex({
                name: 'UQ_project_members_project_user',
                columnNames: ['project_id', 'user_id'],
                isUnique: true,
            }),
        );

        // Step 3: Add individual indexes for performance
        await queryRunner.createIndex(
            'project_members',
            new TableIndex({
                name: 'IDX_project_members_project_id',
                columnNames: ['project_id'],
            }),
        );

        await queryRunner.createIndex(
            'project_members',
            new TableIndex({
                name: 'IDX_project_members_user_id',
                columnNames: ['user_id'],
            }),
        );

        // Step 4: Add foreign key to projects
        await queryRunner.createForeignKey(
            'project_members',
            new TableForeignKey({
                name: 'FK_project_members_project',
                columnNames: ['project_id'],
                referencedTableName: 'projects',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
        );

        // Step 5: Add foreign key to users
        await queryRunner.createForeignKey(
            'project_members',
            new TableForeignKey({
                name: 'FK_project_members_user',
                columnNames: ['user_id'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
        );

        // Step 6: Rename camp_date to start_date in projects table
        await queryRunner.renameColumn('projects', 'camp_date', 'start_date');

        // Step 7: Add end_date column to projects table
        await queryRunner.query(`
      ALTER TABLE "projects" ADD COLUMN "end_date" date NULL
    `);

        // Step 8: Create a Default Project for orphan patients (if any exist)
        const orphanPatientsCount = await queryRunner.query(`
      SELECT COUNT(*) as count FROM "patients" WHERE "project_id" IS NULL
    `);

        if (parseInt(orphanPatientsCount[0].count) > 0) {
            // Create default project
            await queryRunner.query(`
        INSERT INTO "projects" (
          "id", "name", "description", "status", "start_date", "patient_count", "total_revenue", "created_at", "updated_at"
        ) VALUES (
          uuid_generate_v4(),
          'Default Project',
          'Auto-created project for patients without a project assignment',
          'ACTIVE',
          CURRENT_DATE,
          0,
          0,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
        ON CONFLICT (name) DO NOTHING
      `);

            // Get the default project ID
            const defaultProject = await queryRunner.query(`
        SELECT "id" FROM "projects" WHERE "name" = 'Default Project' LIMIT 1
      `);

            if (defaultProject.length > 0) {
                // Assign orphan patients to the default project
                await queryRunner.query(`
          UPDATE "patients"
          SET "project_id" = '${defaultProject[0].id}'
          WHERE "project_id" IS NULL
        `);

                // Update patient count
                await queryRunner.query(`
          UPDATE "projects"
          SET "patient_count" = (SELECT COUNT(*) FROM "patients" WHERE "project_id" = '${defaultProject[0].id}')
          WHERE "id" = '${defaultProject[0].id}'
        `);

                console.log(`Migrated ${orphanPatientsCount[0].count} orphan patients to Default Project`);
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Step 1: Remove end_date column
        await queryRunner.query(`
      ALTER TABLE "projects" DROP COLUMN IF EXISTS "end_date"
    `);

        // Step 2: Rename start_date back to camp_date
        await queryRunner.renameColumn('projects', 'start_date', 'camp_date');

        // Step 3: Drop foreign keys
        await queryRunner.dropForeignKey('project_members', 'FK_project_members_user');
        await queryRunner.dropForeignKey('project_members', 'FK_project_members_project');

        // Step 4: Drop indexes
        await queryRunner.dropIndex('project_members', 'IDX_project_members_user_id');
        await queryRunner.dropIndex('project_members', 'IDX_project_members_project_id');
        await queryRunner.dropIndex('project_members', 'UQ_project_members_project_user');

        // Step 5: Drop project_members table
        await queryRunner.dropTable('project_members');

        // Note: We don't delete the Default Project or unassign patients in rollback
        // as this could cause data loss
    }
}
