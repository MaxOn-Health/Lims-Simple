import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey } from "typeorm";

export class AuditFixes1733745000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Password Reset Tokens
        await queryRunner.createTable(new Table({
            name: "password_reset_tokens",
            columns: [
                { name: "id", type: "uuid", isPrimary: true, generationStrategy: "uuid", default: "uuid_generate_v4()" },
                { name: "token", type: "varchar", length: "255" },
                { name: "user_id", type: "uuid" },
                { name: "expires_at", type: "timestamp" },
                { name: "created_at", type: "timestamp", default: "now()" }
            ]
        }), true);

        // Index for token lookup
        await queryRunner.query(`CREATE INDEX "IDX_password_reset_token" ON "password_reset_tokens" ("token")`);

        await queryRunner.createForeignKey("password_reset_tokens", new TableForeignKey({
            columnNames: ["user_id"],
            referencedColumnNames: ["id"],
            referencedTableName: "users",
            onDelete: "CASCADE"
        }));

        // 2. Soft Deletes (deleted_at)
        const tables = ["users", "patients", "tests", "packages", "reports"];
        for (const table of tables) {
            await queryRunner.addColumn(table, new TableColumn({
                name: "deleted_at",
                type: "timestamp",
                isNullable: true
            }));
        }

        // 3. Sample Events (Chain of Custody)
        await queryRunner.createTable(new Table({
            name: "sample_events",
            columns: [
                { name: "id", type: "uuid", isPrimary: true, generationStrategy: "uuid", default: "uuid_generate_v4()" },
                { name: "sample_id", type: "uuid" },
                { name: "status", type: "varchar", length: "50" },
                { name: "notes", type: "text", isNullable: true },
                { name: "created_by", type: "uuid" },
                { name: "created_at", type: "timestamp", default: "now()" }
            ]
        }), true);

        await queryRunner.query(`CREATE INDEX "IDX_sample_events_sample_id" ON "sample_events" ("sample_id")`);

        await queryRunner.createForeignKey("sample_events", new TableForeignKey({
            columnNames: ["sample_id"],
            referencedColumnNames: ["id"],
            referencedTableName: "blood_samples",
            onDelete: "CASCADE"
        }));

        await queryRunner.createForeignKey("sample_events", new TableForeignKey({
            columnNames: ["created_by"],
            referencedColumnNames: ["id"],
            referencedTableName: "users",
            onDelete: "SET NULL"
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop Sample Events
        const sampleEventsTable = await queryRunner.getTable("sample_events");
        const sampleForeignKey = sampleEventsTable.foreignKeys.find(fk => fk.columnNames.indexOf("sample_id") !== -1);
        const userForeignKey = sampleEventsTable.foreignKeys.find(fk => fk.columnNames.indexOf("created_by") !== -1);
        await queryRunner.dropForeignKey("sample_events", sampleForeignKey);
        await queryRunner.dropForeignKey("sample_events", userForeignKey);
        await queryRunner.dropTable("sample_events");

        // Remove soft deletes
        const tables = ["users", "patients", "tests", "packages", "reports"];
        for (const table of tables) {
            await queryRunner.dropColumn(table, "deleted_at");
        }

        // Drop Password Reset Tokens
        const resetTable = await queryRunner.getTable("password_reset_tokens");
        const resetForeignKey = resetTable.foreignKeys.find(fk => fk.columnNames.indexOf("user_id") !== -1);
        await queryRunner.dropForeignKey("password_reset_tokens", resetForeignKey);
        await queryRunner.dropTable("password_reset_tokens");
    }
}
