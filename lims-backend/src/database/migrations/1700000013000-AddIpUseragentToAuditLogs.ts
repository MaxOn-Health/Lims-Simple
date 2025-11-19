import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddIpUseragentToAuditLogs1700000013000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'audit_logs',
      new TableColumn({
        name: 'ip_address',
        type: 'varchar',
        length: '45',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'audit_logs',
      new TableColumn({
        name: 'user_agent',
        type: 'varchar',
        length: '500',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('audit_logs', 'user_agent');
    await queryRunner.dropColumn('audit_logs', 'ip_address');
  }
}



