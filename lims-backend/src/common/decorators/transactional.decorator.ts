import { Logger } from '@nestjs/common';
import { QueryRunner } from 'typeorm';

/**
 * Transactional decorator options
 */
export interface TransactionalOptions {
  /**
   * Maximum number of retry attempts on deadlock
   * @default 3
   */
  maxRetries?: number;

  /**
   * Isolation level for the transaction
   * Uses the database default if not specified
   */
  isolationLevel?: 'READ UNCOMMITTED' | 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE';
}

/**
 * Storage for the TransactionManager instance
 * Will be set when the decorator is first used
 */
let transactionManager: any = null;

/**
 * Set the TransactionManager instance (called by TransactionalInterceptor)
 */
export function setTransactionManager(manager: any): void {
  transactionManager = manager;
}

/**
 * Method decorator that wraps the method execution in a database transaction
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class PatientsService {
 *   constructor(
 *     private transactionManager: TransactionManager,
 *     @InjectRepository(Patient)
 *     private patientsRepository: Repository<Patient>,
 *   ) {}
 *
 *   @Transactional()
 *   async register(dto: CreatePatientDto, userId: string): Promise<PatientResponseDto> {
 *     const qr = this.transactionManager.getCurrentTransaction();
 *     const patientRepo = new TransactionalRepository(this.patientsRepository, qr);
 *
 *     const patient = await patientRepo.save({...});
 *     // All operations here are in the same transaction
 *     return patient;
 *   }
 * }
 * ```
 */
export function Transactional(options: TransactionalOptions = {}): MethodDecorator {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    const logger = new Logger(`${target.constructor.name}:${String(propertyKey)}`);

    descriptor.value = async function (...args: any[]) {
      // Lazy injection of transactionManager from 'this'
      const manager = transactionManager || (this as any).transactionManager;

      if (!manager) {
        logger.warn('TransactionManager not found. Executing method without transaction.');
        return originalMethod.apply(this, args);
      }

      const executeWithRetry = async () => {
        return manager.runInTransaction(async (qr: QueryRunner) => {
          // Bind the QueryRunner to the method's 'this' context
          // This allows access via this.transactionManager.getCurrentTransaction()
          return originalMethod.apply(this, args);
        }, options.isolationLevel);
      };

      // Use withRetry if maxRetries is specified
      if (options.maxRetries !== undefined && options.maxRetries > 0) {
        try {
          return await manager.withRetry(executeWithRetry, options.maxRetries);
        } catch (error) {
          logger.error(`Transaction failed after ${options.maxRetries} retries: ${error.message}`);
          throw error;
        }
      }

      // Execute without retry
      return executeWithRetry();
    };

    // Preserve the original method's metadata (name, length, etc.)
    // Copy properties from originalMethod to the new wrapped function
    const newMethod = descriptor.value;
    Object.getOwnPropertyNames(originalMethod).forEach((key) => {
      // Skip non-configurable properties like 'length', 'name', 'arguments', 'caller'
      if (['length', 'name', 'arguments', 'caller', 'prototype'].includes(key)) {
        return;
      }
      try {
        const propDescriptor = Object.getOwnPropertyDescriptor(originalMethod, key);
        if (propDescriptor && propDescriptor.configurable) {
          Object.defineProperty(newMethod, key, propDescriptor);
        }
      } catch {
        // Ignore errors for non-configurable properties
      }
    });

    return descriptor;
  };
}
