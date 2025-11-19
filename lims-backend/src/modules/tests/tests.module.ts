import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Test } from './entities/test.entity';
import { PackageTest } from '../packages/entities/package-test.entity';
import { TestsService } from './tests.service';
import { TestsController } from './tests.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Test, PackageTest]),
  ],
  controllers: [TestsController],
  providers: [TestsService],
  exports: [TestsService, TypeOrmModule],
})
export class TestsModule {}

