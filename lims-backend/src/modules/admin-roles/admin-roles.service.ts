import {
    Injectable,
    ConflictException,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminRole } from './entities/admin-role.entity';
import { CreateAdminRoleDto, UpdateAdminRoleDto, AdminRoleResponseDto } from './dto/admin-role.dto';

@Injectable()
export class AdminRolesService {
    constructor(
        @InjectRepository(AdminRole)
        private adminRolesRepository: Repository<AdminRole>,
    ) { }

    async create(createDto: CreateAdminRoleDto): Promise<AdminRoleResponseDto> {
        // Check if name already exists
        const existing = await this.adminRolesRepository.findOne({
            where: { name: createDto.name },
        });

        if (existing) {
            throw new ConflictException(`Admin role with name "${createDto.name}" already exists`);
        }

        const adminRole = this.adminRolesRepository.create({
            name: createDto.name,
            displayName: createDto.displayName,
            description: createDto.description || null,
            isActive: true,
        });

        const saved = await this.adminRolesRepository.save(adminRole);
        return this.mapToDto(saved);
    }

    async findAll(includeInactive = false): Promise<AdminRoleResponseDto[]> {
        const queryBuilder = this.adminRolesRepository
            .createQueryBuilder('role')
            .orderBy('role.displayName', 'ASC');

        if (!includeInactive) {
            queryBuilder.where('role.isActive = :isActive', { isActive: true });
        }

        const roles = await queryBuilder.getMany();
        return roles.map((role) => this.mapToDto(role));
    }

    async findById(id: string): Promise<AdminRoleResponseDto> {
        const role = await this.adminRolesRepository.findOne({ where: { id } });

        if (!role) {
            throw new NotFoundException(`Admin role with ID "${id}" not found`);
        }

        return this.mapToDto(role);
    }

    async findByName(name: string): Promise<AdminRole | null> {
        return this.adminRolesRepository.findOne({ where: { name } });
    }

    async update(id: string, updateDto: UpdateAdminRoleDto): Promise<AdminRoleResponseDto> {
        const role = await this.adminRolesRepository.findOne({ where: { id } });

        if (!role) {
            throw new NotFoundException(`Admin role with ID "${id}" not found`);
        }

        if (updateDto.displayName !== undefined) {
            role.displayName = updateDto.displayName;
        }

        if (updateDto.description !== undefined) {
            role.description = updateDto.description;
        }

        if (updateDto.isActive !== undefined) {
            role.isActive = updateDto.isActive;
        }

        const updated = await this.adminRolesRepository.save(role);
        return this.mapToDto(updated);
    }

    async delete(id: string): Promise<void> {
        const role = await this.adminRolesRepository.findOne({ where: { id } });

        if (!role) {
            throw new NotFoundException(`Admin role with ID "${id}" not found`);
        }

        // Check if role is in use by any users or tests
        // For now, we'll just soft delete by setting isActive to false
        role.isActive = false;
        await this.adminRolesRepository.save(role);
    }

    async getActiveRoleNames(): Promise<string[]> {
        const roles = await this.adminRolesRepository.find({
            where: { isActive: true },
            select: ['name'],
        });
        return roles.map((r) => r.name);
    }

    private mapToDto(role: AdminRole): AdminRoleResponseDto {
        return {
            id: role.id,
            name: role.name,
            displayName: role.displayName,
            description: role.description,
            isActive: role.isActive,
            createdAt: role.createdAt,
            updatedAt: role.updatedAt,
        };
    }
}
