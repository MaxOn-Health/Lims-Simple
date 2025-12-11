import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PasswordService } from '../../common/services/password.service';
import { AuditModule } from '../audit/audit.module';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), AuditModule, ProjectsModule],
  controllers: [UsersController],
  providers: [UsersService, PasswordService],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule { }

