import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Patient } from '../../patients/entities/patient.entity';
import { Test } from '../../tests/entities/test.entity';
import { User } from '../../users/entities/user.entity';
import { AssignmentStatus } from '../constants/assignment-status.enum';

@Entity('assignments')
@Unique(['patientId', 'testId'])
export class Assignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'patient_id', nullable: false })
  @Index('IDX_assignments_patient_id')
  patientId: string;

  @Column({ type: 'uuid', name: 'test_id', nullable: false })
  @Index('IDX_assignments_test_id')
  testId: string;

  @Column({ type: 'uuid', name: 'admin_id', nullable: true })
  @Index('IDX_assignments_admin_id')
  adminId: string | null;

  @Column({
    type: 'enum',
    enum: AssignmentStatus,
    default: AssignmentStatus.PENDING,
    nullable: false,
  })
  @Index('IDX_assignments_status')
  status: AssignmentStatus;

  @Column({ type: 'timestamp', name: 'assigned_at', nullable: true })
  assignedAt: Date | null;

  @Column({ type: 'timestamp', name: 'started_at', nullable: true })
  startedAt: Date | null;

  @Column({ type: 'timestamp', name: 'completed_at', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'uuid', name: 'assigned_by', nullable: true })
  assignedBy: string | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    name: 'updated_at',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @ManyToOne(() => Test, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'test_id' })
  test: Test;

  @ManyToOne(() => User, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'admin_id' })
  admin: User | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'assigned_by' })
  assignedByUser: User | null;
}

