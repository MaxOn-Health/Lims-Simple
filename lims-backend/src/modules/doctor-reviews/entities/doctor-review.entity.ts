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

@Entity('doctor_reviews')
@Unique(['patientId', 'doctorId'])
export class DoctorReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'patient_id', nullable: false })
  @Index('IDX_doctor_reviews_patient_id')
  patientId: string;

  @Column({ type: 'uuid', name: 'doctor_id', nullable: false })
  @Index('IDX_doctor_reviews_doctor_id')
  doctorId: string;

  @Column({ type: 'text', nullable: true })
  remarks: string | null;

  @Column({ type: 'timestamp', name: 'reviewed_at', nullable: true })
  reviewedAt: Date | null;

  @Column({ type: 'timestamp', name: 'signed_at', nullable: true })
  signedAt: Date | null;

  @Column({ type: 'boolean', name: 'passkey_verified', default: false, nullable: false })
  passkeyVerified: boolean;

  @Column({ type: 'boolean', name: 'is_signed', default: false, nullable: false })
  @Index('IDX_doctor_reviews_is_signed')
  isSigned: boolean;

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
  @JoinColumn({ name: 'doctor_id' })
  doctor: User;
}
