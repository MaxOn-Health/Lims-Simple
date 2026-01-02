import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminRole } from './entities/admin-role.entity';
import { AdminRolesService } from './admin-roles.service';
import { AdminRolesController } from './admin-roles.controller';

@Module({
    imports: [TypeOrmModule.forFeature([AdminRole])],
    controllers: [AdminRolesController],
    providers: [AdminRolesService],
    exports: [AdminRolesService],
})
export class AdminRolesModule { }
