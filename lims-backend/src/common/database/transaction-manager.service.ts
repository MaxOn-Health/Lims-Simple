import { Injectable, Scope, Logger } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import { ModuleRef } from '@nestjs/core';
import { AsyncLocalStorage } from 'async_hooks';
import { EventEmitter2 } from '@nestjs/event-emitter';

/**
 * Interface for transaction context stored in AsyncLocalStorage
 */
interface TransactionContext {
  queryRunner: QueryRunner;
  level: number;
  isRollbackOnly: boolean;
  transactionId: string;
}

/**
 * Transaction Manager Service
 *
 * Manages database transactions using QueryRunner pattern with AsyncLocalStorage
 * for handling nested transaction scenarios.
 */
@Injectable({ scope: Scope.DEFAULT })
export class TransactionManager {
  private readonly logger = new Logger(TransactionManager.name);
  private readonly asyncLocalStorage = new AsyncLocalStorage<TransactionContext>();
  private readonly dataSource: DataSource;
  private transactionCounter = 0;

  constructor(
    private moduleRef: ModuleRef,
    private eventEmitter: EventEmitter2,
  ) {
    // Get the DataSource from the moduleRef or use a token
    // This will be set properly through the module
    this.dataSource = null as unknown as DataSource;
  }

  /**
   * Generate a unique transaction ID
   */
  private generateTransactionId(): string {
    return `tx_${Date.now()}_${++this.transactionCounter}`;
  }

  /**
   * Set the DataSource (called by DatabaseModule)
   */
  setDataSource(dataSource: DataSource): void {
    (this as any).dataSource = dataSource;
  }

  /**
   * Run a callback within a transaction
   *
   * @param callback - The function to execute within the transaction
   * @param isolationLevel - Optional isolation level for the transaction
   * @returns The result of the callback
   */
  async runInTransaction<T>(
    callback: (qr: QueryRunner) => Promise<T>,
    isolationLevel?: 'READ UNCOMMITTED' | 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE',
  ): Promise<T> {
    const existingContext = this.asyncLocalStorage.getStore();

    // If we're already in a transaction, reuse it (nested transaction support)
    if (existingContext) {
      this.logger.debug(`Using existing transaction at level ${existingContext.level}`);
      existingContext.level++;
      try {
        const result = await callback(existingContext.queryRunner);
        existingContext.level--;
        return result;
      } catch (error) {
        existingContext.level--;
        if (existingContext.isRollbackOnly) {
          throw error;
        }
        // In nested transactions, we let the outer transaction handle rollback
        throw error;
      }
    }

    // Start a new transaction
    const queryRunner = this.createQueryRunner();
    const transactionId = this.generateTransactionId();

    try {
      await queryRunner.startTransaction(isolationLevel);
      this.logger.debug(`Transaction started${isolationLevel ? ` with isolation level: ${isolationLevel}` : ''}`);

      const context: TransactionContext = {
        queryRunner,
        level: 1,
        isRollbackOnly: false,
        transactionId,
      };

      const result = await this.asyncLocalStorage.run(context, async () => {
        return await callback(queryRunner);
      });

      // Only commit if not marked for rollback
      if (!context.isRollbackOnly) {
        await queryRunner.commitTransaction();
        this.logger.debug('Transaction committed');

        // Emit event after successful commit for audit log flushing
        this.eventEmitter.emit('transaction.committed', {
          transactionId,
          timestamp: new Date(),
        });
      } else {
        await queryRunner.rollbackTransaction();
        this.logger.debug('Transaction rolled back (rollback-only)');
      }

      return result;
    } catch (error) {
      await this.handleError(queryRunner, error);
      throw error;
    } finally {
      await this.releaseQueryRunner(queryRunner);
    }
  }

  /**
   * Get the current transaction's QueryRunner
   *
   * @throws Error if not in a transaction
   */
  getCurrentTransaction(): QueryRunner {
    const context = this.asyncLocalStorage.getStore();
    if (!context) {
      throw new Error(
        'No active transaction. Use @Transactional() decorator or runInTransaction() method.',
      );
    }
    return context.queryRunner;
  }

  /**
   * Check if currently in a transaction
   */
  isInTransaction(): boolean {
    const context = this.asyncLocalStorage.getStore();
    return context !== undefined && context.queryRunner?.isTransactionActive;
  }

  /**
   * Get the current transaction ID
   * Returns undefined if not in a transaction
   */
  getCurrentTransactionId(): string | undefined {
    const context = this.asyncLocalStorage.getStore();
    return context?.transactionId;
  }

  /**
   * Mark the current transaction for rollback (will rollback on completion)
   *
   * This method allows you to mark a transaction for rollback without throwing an error.
   * The transaction will still complete normally, but will be rolled back instead of committed.
   *
   * @example
   * ```typescript
   * @Transactional()
   * async myMethod() {
   *   const qr = this.transactionManager.getCurrentTransaction();
   *
   *   // Do some work...
   *   await qr.manager.insert(SomeEntity, { ... });
   *
   *   // Check business condition
   *   if (someCondition) {
   *     // Mark transaction for rollback - no error thrown
   *     this.transactionManager.setRollbackOnly();
   *     return; // Transaction will rollback on exit
   *   }
   *
   *   // Continue with more work...
   * }
   * ```
   *
   * Use cases:
   * - Business logic validation where you want to gracefully rollback
   * - Conditional rollbacks without throwing exceptions
   * - Complex validation scenarios where rollback decision is made mid-transaction
   *
   * Note: If setRollbackOnly() is called, the transaction will rollback even if no
   * exception is thrown. The method completes normally from the caller's perspective.
   */
  setRollbackOnly(): void {
    const context = this.asyncLocalStorage.getStore();
    if (context) {
      context.isRollbackOnly = true;
      this.logger.debug('Transaction marked for rollback');
    }
  }

  /**
   * Create a new QueryRunner
   */
  createQueryRunner(): QueryRunner {
    if (!this.dataSource) {
      throw new Error('DataSource not initialized. Ensure DatabaseModule is imported.');
    }
    return this.dataSource.createQueryRunner();
  }

  /**
   * Release a QueryRunner
   */
  private async releaseQueryRunner(queryRunner: QueryRunner): Promise<void> {
    try {
      if (!queryRunner.isReleased) {
        await queryRunner.release();
      }
    } catch (error) {
      this.logger.warn(`Error releasing query runner: ${error.message}`);
    }
  }

  /**
   * Handle transaction errors with retry logic for deadlocks
   */
  private async handleError(queryRunner: QueryRunner, error: any): Promise<void> {
    // PostgreSQL deadlock error code: 40P01
    const isDeadlock = error.code === '40P01' || error.code === '40001';

    if (isDeadlock) {
      this.logger.warn(`Deadlock detected: ${error.message}. Transaction will be retried by the application layer if needed.`);
    }

    try {
      await queryRunner.rollbackTransaction();
      this.logger.debug('Transaction rolled back due to error');
    } catch (rollbackError) {
      this.logger.error(`Failed to rollback transaction: ${rollbackError.message}`);
    }
  }

  /**
   * Execute a callback with automatic retry on deadlock
   *
   * @param callback - The function to execute
   * @param maxRetries - Maximum number of retry attempts
   * @returns The result of the callback
   */
  async withRetry<T>(
    callback: () => Promise<T>,
    maxRetries: number = 3,
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await callback();
      } catch (error) {
        lastError = error;
        const isDeadlock = error.code === '40P01' || error.code === '40001';

        if (isDeadlock && attempt < maxRetries) {
          const delay = Math.random() * 100 * attempt; // Exponential backoff with jitter
          this.logger.warn(`Retry attempt ${attempt}/${maxRetries} after ${delay.toFixed(0)}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      }
    }

    throw lastError;
  }
}
