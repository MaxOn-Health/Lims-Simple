import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BloodSample } from './blood-sample.entity';
import { User } from '../../users/entities/user.entity';

@Entity('blood_sample_access')
export class BloodSampleAccess {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'sample_id', nullable: false })
  @Index('IDX_blood_sample_access_sample_id')
  sampleId: string;

  @Column({ type: 'uuid', name: 'accessed_by', nullable: false })
  @Index('IDX_blood_sample_access_accessed_by')
  accessedBy: string;

  @CreateDateColumn({ type: 'timestamp', name: 'accessed_at', default: () => 'CURRENT_TIMESTAMP' })
  @Index('IDX_blood_sample_access_accessed_at')
  accessedAt: Date;

  @ManyToOne(() => BloodSample, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sample_id' })
  sample: BloodSample;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'accessed_by' })
  accessedByUser: User;
}





