import { Module, Global, DynamicModule, Provider } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TransactionManager } from './transaction-manager.service';
import { setTransactionManager } from '../decorators/transactional.decorator';

/**
 * Database Module
 *
 * Provides the TransactionManager as a global service for managing transactions.
 * This module must be imported in app.module.ts before other modules.
 */
@Global()
@Module({})
export class DatabaseModule {
  /**
   * Register the DatabaseModule with TypeORM's DataSource
   *
   * @example
   * ```typescript
   * @Module({
   *   imports: [
   *     DatabaseModule.forRoot(),
   *     // ... other modules
   *   ],
   * })
   * export class AppModule {}
   * ```
   */
  static forRoot(): DynamicModule {
    const transactionManagerProvider: Provider = {
      provide: TransactionManager,
      useClass: TransactionManager,
    };

    const dataSourceProvider: Provider = {
      provide: 'DATABASE_DATA_SOURCE',
      useFactory: async (dataSource: DataSource) => {
        return dataSource;
      },
      inject: [DataSource],
    };

    return {
      module: DatabaseModule,
      providers: [transactionManagerProvider, dataSourceProvider],
      exports: [TransactionManager],
    };
  }

  /**
   * Module initialization hook to configure TransactionManager with DataSource
   */
  async onModuleInit() {
    // This will be called after the module is initialized
    // The actual DataSource injection will happen through the provider
  }
}

/**
 * Custom provider to set the DataSource on TransactionManager after it's created
 */
export class TransactionManagerInitializer {
  constructor(
    private readonly transactionManager: TransactionManager,
    private readonly dataSource: DataSource,
  ) {
    // Set the DataSource on the TransactionManager
    (transactionManager as any).setDataSource(dataSource);

    // Also set it for the decorator to access
    setTransactionManager(transactionManager);
  }
}
