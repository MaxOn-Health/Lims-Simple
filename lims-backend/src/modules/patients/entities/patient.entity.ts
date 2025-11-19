import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Gender } from '../constants/gender.enum';
import { PatientPackage } from './patient-package.entity';
import { Project } from '../../projects/entities/project.entity';

@Entity('patients')
export class Patient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true, name: 'patient_id' })
  @Index()
  patientId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'integer' })
  age: number;

  @Column({
    type: 'enum',
    enum: Gender,
  })
  gender: Gender;

  @Column({ type: 'varchar', length: 20, name: 'contact_number' })
  @Index()
  contactNumber: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'employee_id' })
  @Index()
  employeeId: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'company_name' })
  companyName: string | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @ManyToOne(() => Project, { nullable: true })
  @JoinColumn({ name: 'project_id' })
  project: Project | null;

  @Column({ type: 'uuid', nullable: true, name: 'project_id' })
  @Index()
  projectId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => PatientPackage, (patientPackage) => patientPackage.patient)
  patientPackages: PatientPackage[];
}

