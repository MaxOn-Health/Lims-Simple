import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddBarcodeToPatient1734676161000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            'patients',
            new TableColumn({
                name: 'barcode_number',
                type: 'varchar',
                length: '10',
                isUnique: true,
                isNullable: true,
            }),
        );

        await queryRunner.createIndex(
            'patients',
            new TableIndex({
                name: 'IDX_patients_barcode_number',
                columnNames: ['barcode_number'],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropIndex('patients', 'IDX_patients_barcode_number');
        await queryRunner.dropColumn('patients', 'barcode_number');
    }
}
