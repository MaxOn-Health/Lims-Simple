import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  /**
   * Log an audit entry
   */
  async log(
    userId: string | null,
    action: string,
    entityType: string,
    entityId: string | null,
    changes?: Record<string, any>,
    ipAddress?: string | null,
    userAgent?: string | null,
  ): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create({
      userId,
      action,
      entityType,
      entityId,
      changes: changes || null,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    });

    return this.auditLogRepository.save(auditLog);
  }

  /**
   * Find all audit logs with filtering and pagination
   */
  async findAll(query: QueryAuditLogsDto): Promise<{
    data: AuditLog[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { user_id, action, entity_type, date_from, date_to, page = 1, limit = 10 } = query;

    const queryBuilder: SelectQueryBuilder<AuditLog> = this.auditLogRepository
      .createQueryBuilder('audit_log')
      .leftJoinAndSelect('audit_log.user', 'user')
      .orderBy('audit_log.timestamp', 'DESC');

    if (user_id) {
      queryBuilder.andWhere('audit_log.userId = :user_id', { user_id });
    }

    if (action) {
      queryBuilder.andWhere('audit_log.action = :action', { action });
    }

    if (entity_type) {
      queryBuilder.andWhere('audit_log.entityType = :entity_type', { entity_type });
    }

    if (date_from) {
      queryBuilder.andWhere('audit_log.timestamp >= :date_from', { date_from });
    }

    if (date_to) {
      queryBuilder.andWhere('audit_log.timestamp <= :date_to', { date_to });
    }

    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Find all audit logs for a specific entity
   */
  async findByEntity(entityType: string, entityId: string): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: {
        entityType,
        entityId,
      },
      relations: ['user'],
      order: {
        timestamp: 'DESC',
      },
    });
  }
}

