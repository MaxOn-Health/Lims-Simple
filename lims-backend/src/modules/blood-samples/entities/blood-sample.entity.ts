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
import { User } from '../../users/entities/user.entity';
import { Assignment } from '../../assignments/entities/assignment.entity';
import { BloodSampleStatus } from '../constants/blood-sample-status.enum';

@Entity('blood_samples')
@Unique(['sampleId'])
export class BloodSample {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'patient_id', nullable: false })
  @Index('IDX_blood_samples_patient_id')
  patientId: string;

  @Column({ type: 'varchar', length: 50, unique: true, name: 'sample_id', nullable: false })
  @Index('IDX_blood_samples_sample_id')
  sampleId: string;

  @Column({ type: 'varchar', length: 255, name: 'passcode_hash', nullable: false })
  passcodeHash: string;

  @Column({ type: 'timestamp', name: 'collected_at', default: () => 'CURRENT_TIMESTAMP', nullable: false })
  collectedAt: Date;

  @Column({ type: 'uuid', name: 'collected_by', nullable: false })
  @Index('IDX_blood_samples_collected_by')
  collectedBy: string;

  @Column({
    type: 'enum',
    enum: BloodSampleStatus,
    default: BloodSampleStatus.COLLECTED,
    nullable: false,
  })
  @Index('IDX_blood_samples_status')
  status: BloodSampleStatus;

  @Column({ type: 'timestamp', name: 'tested_at', nullable: true })
  testedAt: Date | null;

  @Column({ type: 'uuid', name: 'tested_by', nullable: true })
  @Index('IDX_blood_samples_tested_by')
  testedBy: string | null;

  @Column({ type: 'uuid', name: 'assignment_id', nullable: true })
  @Index('IDX_blood_samples_assignment_id')
  assignmentId: string | null;

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

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'collected_by' })
  collectedByUser: User;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'tested_by' })
  testedByUser: User | null;

  @ManyToOne(() => Assignment, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'assignment_id' })
  assignment: Assignment | null;
}






