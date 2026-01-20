import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';
import { TransactionManager } from '../../common/database/transaction-manager.service';
import { OnEvent } from '@nestjs/event-emitter';

/**
 * Audit log entry that's queued for writing after transaction commit
 */
interface QueuedAuditLog {
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  changes?: Record<string, any>;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Event payload for transaction.committed event
 */
interface TransactionCommittedEvent {
  transactionId: string;
  timestamp: Date;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  private transactionManager: TransactionManager | null = null;

  /**
   * Map of transaction ID to queued audit logs
   * This allows audit logs to be queued during a transaction
   * and flushed after the transaction commits.
   */
  private auditLogQueue: Map<string, QueuedAuditLog[]> = new Map();

  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  /**
   * Set the TransactionManager (called by module setup)
   */
  setTransactionManager(transactionManager: TransactionManager): void {
    this.transactionManager = transactionManager;
  }

  /**
   * Check if we're currently in a transaction
   */
  private isInTransaction(): boolean {
    return this.transactionManager?.isInTransaction() || false;
  }

  /**
   * Get the current transaction ID
   */
  private getCurrentTransactionId(): string | undefined {
    return this.transactionManager?.getCurrentTransactionId();
  }

  /**
   * Queue an audit log for writing after transaction commit
   */
  private queueAuditLog(transactionId: string, logData: QueuedAuditLog): void {
    if (!this.auditLogQueue.has(transactionId)) {
      this.auditLogQueue.set(transactionId, []);
    }
    this.auditLogQueue.get(transactionId)!.push(logData);
  }

  /**
   * Write all queued audit logs
   */
  private async writeQueuedLogs(queue: QueuedAuditLog[]): Promise<void> {
    for (const logData of queue) {
      try {
        await this.writeLog(logData);
      } catch (error) {
        this.logger.error(`Failed to write queued audit log: ${error.message}`, error.stack);
      }
    }
  }

  /**
   * Event handler for transaction.committed event
   * Flushes all queued audit logs for the committed transaction
   */
  @OnEvent('transaction.committed')
  async handleTransactionCommitted(payload: TransactionCommittedEvent): Promise<void> {
    const logs = this.auditLogQueue.get(payload.transactionId);
    if (logs && logs.length > 0) {
      this.logger.debug(`Flushing ${logs.length} queued audit logs for transaction ${payload.transactionId}`);
      await this.writeQueuedLogs(logs);
      this.auditLogQueue.delete(payload.transactionId);
    }
  }

  /**
   * Log an audit entry
   *
   * If called within a transaction, the audit log is queued and written
   * after the transaction commits (eventual consistency).
   * This ensures that audit log failures don't roll back business transactions.
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
    const logData: QueuedAuditLog = {
      userId,
      action,
      entityType,
      entityId,
      changes: changes || null,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    };

    // If we're in a transaction, queue the audit log for later writing
    const transactionId = this.getCurrentTransactionId();
    if (transactionId) {
      this.logger.debug(`Queueing audit log for ${action} on ${entityType}`);
      this.queueAuditLog(transactionId, logData);
      // Return a pending audit log (won't have ID yet)
      return this.auditLogRepository.create(logData) as AuditLog;
    }

    // Otherwise, write immediately
    return this.writeLog(logData);
  }

  /**
   * Write a single audit log to the database
   */
  private async writeLog(logData: QueuedAuditLog): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create({
      userId: logData.userId,
      action: logData.action,
      entityType: logData.entityType,
      entityId: logData.entityId,
      changes: logData.changes || null,
      ipAddress: logData.ipAddress || null,
      userAgent: logData.userAgent || null,
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
