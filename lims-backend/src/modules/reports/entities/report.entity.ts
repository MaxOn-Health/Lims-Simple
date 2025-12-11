import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Patient } from '../../patients/entities/patient.entity';
import { DoctorReview } from '../../doctor-reviews/entities/doctor-review.entity';
import { User } from '../../users/entities/user.entity';
import { ReportStatus } from '../constants/report-status.enum';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'patient_id', nullable: false })
  @Index('IDX_reports_patient_id')
  patientId: string;

  @Column({ type: 'varchar', length: 50, unique: true, name: 'report_number', nullable: false })
  @Index('IDX_reports_report_number')
  reportNumber: string;

  @Column({ type: 'uuid', name: 'doctor_review_id', nullable: true })
  doctorReviewId: string | null;

  @Column({
    type: 'enum',
    enum: ReportStatus,
    default: ReportStatus.PENDING,
    nullable: false,
  })
  @Index('IDX_reports_status')
  status: ReportStatus;

  @Column({ type: 'varchar', length: 500, name: 'pdf_url', nullable: true })
  pdfUrl: string | null;

  @Column({ type: 'timestamp', name: 'generated_at', nullable: true })
  generatedAt: Date | null;

  @Column({ type: 'uuid', name: 'generated_by', nullable: true })
  generatedBy: string | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    name: 'updated_at',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

  @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @ManyToOne(() => DoctorReview, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'doctor_review_id' })
  doctorReview: DoctorReview | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'generated_by' })
  generatedByUser: User | null;
}






