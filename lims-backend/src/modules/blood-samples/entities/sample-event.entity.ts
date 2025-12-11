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

@Entity('sample_events')
export class SampleEvent {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', name: 'sample_id' })
    @Index()
    sampleId: string;

    @Column({ type: 'varchar', length: 50 })
    status: string;

    @Column({ type: 'text', nullable: true })
    notes: string | null;

    @Column({ type: 'uuid', name: 'created_by' })
    createdBy: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @ManyToOne(() => BloodSample, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'sample_id' })
    sample: BloodSample;

    @ManyToOne(() => User, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'created_by' })
    createdByUser: User;
}
