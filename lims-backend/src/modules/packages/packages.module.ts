import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Package } from './entities/package.entity';
import { PackageTest } from './entities/package-test.entity';
import { Test } from '../tests/entities/test.entity';
import { PackagesService } from './packages.service';
import { PackagesController } from './packages.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Package, PackageTest, Test]),
  ],
  controllers: [PackagesController],
  providers: [PackagesService],
  exports: [PackagesService, TypeOrmModule],
})
export class PackagesModule {}

