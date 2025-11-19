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
import { Assignment } from '../../assignments/entities/assignment.entity';
import { User } from '../../users/entities/user.entity';

@Entity('test_results')
@Unique(['assignmentId'])
export class TestResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'assignment_id', nullable: false, unique: true })
  @Index('IDX_test_results_assignment_id')
  assignmentId: string;

  @Column({ type: 'jsonb', name: 'result_values', nullable: false })
  resultValues: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'uuid', name: 'entered_by', nullable: false })
  @Index('IDX_test_results_entered_by')
  enteredBy: string;

  @Column({ type: 'timestamp', name: 'entered_at', default: () => 'CURRENT_TIMESTAMP', nullable: false })
  enteredAt: Date;

  @Column({ type: 'boolean', name: 'is_verified', default: false, nullable: false })
  isVerified: boolean;

  @Column({ type: 'uuid', name: 'verified_by', nullable: true })
  @Index('IDX_test_results_verified_by')
  verifiedBy: string | null;

  @Column({ type: 'timestamp', name: 'verified_at', nullable: true })
  verifiedAt: Date | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    name: 'updated_at',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @ManyToOne(() => Assignment, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'assignment_id' })
  assignment: Assignment;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'entered_by' })
  enteredByUser: User;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'verified_by' })
  verifiedByUser: User | null;
}





