import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';
import { PaymentStatus } from '../../modules/patients/constants/payment-status.enum';

export class CreatePatientPackagesTable1700000005000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create ENUM type for PaymentStatus
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE payment_status_enum AS ENUM ('${PaymentStatus.PENDING}', '${PaymentStatus.PAID}', '${PaymentStatus.PARTIAL}');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.createTable(
      new Table({
        name: 'patient_packages',
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
            name: 'package_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'addon_test_ids',
            type: 'jsonb',
            default: "'[]'",
            isNullable: false,
          },
          {
            name: 'total_price',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'payment_status',
            type: 'enum',
            enum: Object.values(PaymentStatus),
            default: `'${PaymentStatus.PENDING}'`,
            isNullable: false,
          },
          {
            name: 'payment_amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
            isNullable: false,
          },
          {
            name: 'registered_by',
            type: 'uuid',
            isNullable: false,
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

    // Add foreign key for patient_id
    await queryRunner.createForeignKey(
      'patient_packages',
      new TableForeignKey({
        columnNames: ['patient_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'patients',
        onDelete: 'CASCADE',
      }),
    );

    // Add foreign key for package_id
    await queryRunner.createForeignKey(
      'patient_packages',
      new TableForeignKey({
        columnNames: ['package_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'packages',
        onDelete: 'RESTRICT',
      }),
    );

    // Add foreign key for registered_by
    await queryRunner.createForeignKey(
      'patient_packages',
      new TableForeignKey({
        columnNames: ['registered_by'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'RESTRICT',
      }),
    );

    await queryRunner.createIndex(
      'patient_packages',
      new TableIndex({
        name: 'IDX_patient_packages_patient_id',
        columnNames: ['patient_id'],
      }),
    );

    await queryRunner.createIndex(
      'patient_packages',
      new TableIndex({
        name: 'IDX_patient_packages_package_id',
        columnNames: ['package_id'],
      }),
    );

    await queryRunner.createIndex(
      'patient_packages',
      new TableIndex({
        name: 'IDX_patient_packages_payment_status',
        columnNames: ['payment_status'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('patient_packages');
    await queryRunner.query(`DROP TYPE payment_status_enum`);
  }
}

