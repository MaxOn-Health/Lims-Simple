import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    OneToMany,
} from 'typeorm';
import { ProjectStatus } from '../constants/project-status.enum';
import { Patient } from '../../patients/entities/patient.entity';
import { ProjectMember } from './project-member.entity';

@Entity('projects')
export class Project {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 100, unique: true })
    @Index()
    name: string;

    @Column({ type: 'varchar', length: 255 })
    description: string;

    @Column({ type: 'varchar', length: 255, nullable: true, name: 'company_name' })
    companyName: string | null;

    @Column({ type: 'varchar', length: 100, nullable: true, name: 'contact_person' })
    contactPerson: string | null;

    @Column({ type: 'varchar', length: 20, nullable: true, name: 'contact_number' })
    contactNumber: string | null;

    @Column({ type: 'varchar', length: 255, nullable: true, name: 'contact_email' })
    contactEmail: string | null;

    // Renamed from camp_date to start_date via migration
    @Column({ type: 'date', nullable: true, name: 'start_date' })
    startDate: Date | null;

    // New column added via migration
    @Column({ type: 'date', nullable: true, name: 'end_date' })
    endDate: Date | null;

    @Column({ type: 'varchar', length: 255, nullable: true, name: 'camp_location' })
    campLocation: string | null;

    @Column({ type: 'jsonb', nullable: true, name: 'camp_settings' })
    campSettings: {
        autoGeneratePatientIds?: boolean;
        patientIdPrefix?: string;
        requireEmployeeId?: boolean;
        defaultPackageId?: string;
    } | null;

    @Column({ type: 'integer', default: 0, name: 'patient_count' })
    patientCount: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'total_revenue' })
    totalRevenue: number;

    @Column({
        type: 'enum',
        enum: ProjectStatus,
        default: ProjectStatus.ACTIVE,
    })
    @Index()
    status: ProjectStatus;

    @Column({ type: 'text', nullable: true })
    notes: string | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    // Relationships
    @OneToMany(() => Patient, (patient) => patient.project)
    patients: Patient[];

    @OneToMany(() => ProjectMember, (member) => member.project)
    members: ProjectMember[];
}
