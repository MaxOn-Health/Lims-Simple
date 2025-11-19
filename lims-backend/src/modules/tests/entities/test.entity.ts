import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { PackageTest } from '../../packages/entities/package-test.entity';
import { TestCategory } from '../constants/test-category';
import { TestFieldType } from '../constants/test-field-types';

export interface TestField {
  field_name: string;
  field_type: TestFieldType;
  required: boolean;
  options: string[] | null;
}

@Entity('tests')
export class Test {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'enum',
    enum: TestCategory,
  })
  @Index()
  category: TestCategory;

  @Column({ type: 'varchar', length: 100, name: 'admin_role' })
  @Index()
  adminRole: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'normal_range_min' })
  normalRangeMin: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'normal_range_max' })
  normalRangeMax: number | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  unit: string | null;

  @Column({ type: 'jsonb', name: 'test_fields' })
  testFields: TestField[];

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  @Index()
  isActive: boolean;

  @OneToMany(() => PackageTest, (packageTest) => packageTest.test)
  packageTests: PackageTest[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

