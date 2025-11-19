import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey, TableUnique } from 'typeorm';

export class CreateDoctorReviewsTable1700000011000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'doctor_reviews',
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
            name: 'doctor_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'remarks',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'reviewed_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'signed_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'passkey_verified',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'is_signed',
            type: 'boolean',
            default: false,
            isNullable: false,
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

    // Add unique constraint on (patient_id, doctor_id)
    await queryRunner.createUniqueConstraint(
      'doctor_reviews',
      new TableUnique({
        name: 'UQ_doctor_reviews_patient_doctor',
        columnNames: ['patient_id', 'doctor_id'],
      }),
    );

    // Add foreign keys
    await queryRunner.createForeignKey(
      'doctor_reviews',
      new TableForeignKey({
        columnNames: ['patient_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'patients',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'doctor_reviews',
      new TableForeignKey({
        columnNames: ['doctor_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'RESTRICT',
      }),
    );

    // Add indexes
    await queryRunner.createIndex(
      'doctor_reviews',
      new TableIndex({
        name: 'IDX_doctor_reviews_patient_id',
        columnNames: ['patient_id'],
      }),
    );

    await queryRunner.createIndex(
      'doctor_reviews',
      new TableIndex({
        name: 'IDX_doctor_reviews_doctor_id',
        columnNames: ['doctor_id'],
      }),
    );

    await queryRunner.createIndex(
      'doctor_reviews',
      new TableIndex({
        name: 'IDX_doctor_reviews_is_signed',
        columnNames: ['is_signed'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('doctor_reviews');
  }
}
