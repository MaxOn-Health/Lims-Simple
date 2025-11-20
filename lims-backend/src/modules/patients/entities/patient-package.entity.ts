import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Patient } from './patient.entity';
import { Package } from '../../packages/entities/package.entity';
import { User } from '../../users/entities/user.entity';
import { PaymentStatus } from '../constants/payment-status.enum';

@Entity('patient_packages')
export class PatientPackage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'patient_id' })
  @Index()
  patientId: string;

  @Column({ type: 'uuid', name: 'package_id', nullable: true })
  @Index()
  packageId: string | null;

  @Column({ type: 'jsonb', default: '[]', name: 'addon_test_ids' })
  addonTestIds: string[];

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'total_price' })
  totalPrice: number;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
    name: 'payment_status',
  })
  @Index()
  paymentStatus: PaymentStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'payment_amount' })
  paymentAmount: number;

  @Column({ type: 'uuid', name: 'registered_by' })
  registeredBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Patient, (patient) => patient.patientPackages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @ManyToOne(() => Package, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'package_id' })
  package: Package | null;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'registered_by' })
  registeredByUser: User;
}

