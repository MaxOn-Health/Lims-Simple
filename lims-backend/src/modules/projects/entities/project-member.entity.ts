import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    ManyToOne,
    JoinColumn,
    Unique,
} from 'typeorm';
import { Project } from './project.entity';
import { User } from '../../users/entities/user.entity';
import { RoleInProject } from '../constants/role-in-project.enum';

@Entity('project_members')
@Unique(['projectId', 'userId'])
export class ProjectMember {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', name: 'project_id' })
    @Index()
    projectId: string;

    @Column({ type: 'uuid', name: 'user_id' })
    @Index()
    userId: string;

    @Column({
        type: 'varchar',
        length: 50,
        nullable: true,
        name: 'role_in_project',
    })
    roleInProject: RoleInProject | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    // Relationships
    @ManyToOne(() => Project, (project) => project.members, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'project_id' })
    project: Project;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;
}
