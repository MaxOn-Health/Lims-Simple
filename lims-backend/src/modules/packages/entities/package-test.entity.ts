import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { Package } from './package.entity';
import { Test } from '../../tests/entities/test.entity';

@Entity('package_tests')
@Unique(['package', 'test'])
export class PackageTest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Package, (pkg) => pkg.packageTests, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'package_id' })
  @Index()
  package: Package;

  @Column({ name: 'package_id' })
  packageId: string;

  @ManyToOne(() => Test, (test) => test.packageTests, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'test_id' })
  @Index()
  test: Test;

  @Column({ name: 'test_id' })
  testId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'test_price' })
  testPrice: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

