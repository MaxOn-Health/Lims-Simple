import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { TransactionManager } from '../../common/database/transaction-manager.service';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  controllers: [AuditController],
  providers: [AuditService, TransactionManager],
  exports: [AuditService, TypeOrmModule],
})
export class AuditModule {
  constructor(private auditService: AuditService, private transactionManager: TransactionManager) {
    // Set the TransactionManager on AuditService for transaction-aware audit logging
    this.auditService.setTransactionManager(transactionManager);
  }
}

