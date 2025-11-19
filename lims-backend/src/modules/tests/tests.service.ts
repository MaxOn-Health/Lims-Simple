import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Test, TestField } from './entities/test.entity';
import { PackageTest } from '../packages/entities/package-test.entity';
import { CreateTestDto } from './dto/create-test.dto';
import { UpdateTestDto } from './dto/update-test.dto';
import { QueryTestsDto } from './dto/query-tests.dto';

@Injectable()
export class TestsService {
  constructor(
    @InjectRepository(Test)
    private testsRepository: Repository<Test>,
    @InjectRepository(PackageTest)
    private packageTestsRepository: Repository<PackageTest>,
  ) {}

  async create(createTestDto: CreateTestDto): Promise<Test> {
    // Check if test name already exists
    const existingTest = await this.testsRepository.findOne({
      where: { name: createTestDto.name },
    });

    if (existingTest) {
      throw new ConflictException('Test name already exists');
    }

    // Validate normal range
    if (
      createTestDto.normalRangeMin !== undefined &&
      createTestDto.normalRangeMax !== undefined &&
      createTestDto.normalRangeMin >= createTestDto.normalRangeMax
    ) {
      throw new BadRequestException('Normal range min must be less than max');
    }

    const test = this.testsRepository.create({
      name: createTestDto.name,
      description: createTestDto.description || null,
      category: createTestDto.category,
      adminRole: createTestDto.adminRole,
      normalRangeMin: createTestDto.normalRangeMin || null,
      normalRangeMax: createTestDto.normalRangeMax || null,
      unit: createTestDto.unit || null,
      testFields: createTestDto.testFields,
      isActive: true,
    });

    return this.testsRepository.save(test);
  }

  async findAll(query: QueryTestsDto): Promise<Test[]> {
    const where: any = {};

    if (query.category !== undefined) {
      where.category = query.category;
    }

    if (query.adminRole !== undefined) {
      where.adminRole = query.adminRole;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    return this.testsRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Test | null> {
    return this.testsRepository.findOne({
      where: { id },
    });
  }

  async findByAdminRole(adminRole: string): Promise<Test[]> {
    return this.testsRepository.find({
      where: { adminRole, isActive: true },
      order: { name: 'ASC' },
    });
  }

  async update(id: string, updateTestDto: UpdateTestDto): Promise<Test> {
    const test = await this.findById(id);
    if (!test) {
      throw new NotFoundException('Test not found');
    }

    // Check name uniqueness if name is being updated
    if (updateTestDto.name && updateTestDto.name !== test.name) {
      const existingTest = await this.testsRepository.findOne({
        where: { name: updateTestDto.name },
      });
      if (existingTest) {
        throw new ConflictException('Test name already exists');
      }
    }

    // Validate normal range if both are provided
    const normalRangeMin = updateTestDto.normalRangeMin !== undefined 
      ? updateTestDto.normalRangeMin 
      : test.normalRangeMin;
    const normalRangeMax = updateTestDto.normalRangeMax !== undefined 
      ? updateTestDto.normalRangeMax 
      : test.normalRangeMax;

    if (
      normalRangeMin !== null &&
      normalRangeMax !== null &&
      normalRangeMin >= normalRangeMax
    ) {
      throw new BadRequestException('Normal range min must be less than max');
    }

    // TODO: Check if test is used in any package (Phase 4)
    // For now, allow update

    await this.testsRepository.update(id, updateTestDto);
    const updated = await this.findById(id);
    if (!updated) {
      throw new NotFoundException('Test not found after update');
    }
    return updated;
  }

  async softDelete(id: string): Promise<void> {
    const test = await this.findById(id);
    if (!test) {
      throw new NotFoundException('Test not found');
    }

    // Check if test is used in any package
    const packageTests = await this.packageTestsRepository.find({
      where: { testId: id },
    });

    if (packageTests.length > 0) {
      throw new BadRequestException('Cannot delete test that is used in packages');
    }

    // TODO: Check if test is used in any assignment (Phase 4)
    // For now, just check packages

    await this.testsRepository.update(id, { isActive: false });
  }

  validateTestFields(testFields: TestField[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!Array.isArray(testFields) || testFields.length === 0) {
      errors.push('Test fields must be a non-empty array');
      return { isValid: false, errors };
    }

    for (let i = 0; i < testFields.length; i++) {
      const field = testFields[i];
      const fieldIndex = `field[${i}]`;

      if (!field || typeof field !== 'object') {
        errors.push(`${fieldIndex}: Must be an object`);
        continue;
      }

      if (!field.field_name || typeof field.field_name !== 'string') {
        errors.push(`${fieldIndex}: field_name is required and must be a string`);
      }

      if (!field.field_type || typeof field.field_type !== 'string') {
        errors.push(`${fieldIndex}: field_type is required and must be a string`);
      } else {
        const validTypes = ['number', 'text', 'select', 'boolean', 'date', 'file'];
        if (!validTypes.includes(field.field_type)) {
          errors.push(`${fieldIndex}: field_type must be one of: ${validTypes.join(', ')}`);
        }
      }

      if (typeof field.required !== 'boolean') {
        errors.push(`${fieldIndex}: required must be a boolean`);
      }

      if (field.field_type === 'select') {
        if (!Array.isArray(field.options) || field.options.length === 0) {
          errors.push(`${fieldIndex}: options is required for select type and must be a non-empty array`);
        } else if (!field.options.every((opt: any) => typeof opt === 'string')) {
          errors.push(`${fieldIndex}: All options must be strings`);
        }
      } else {
        if (field.options !== null && field.options !== undefined) {
          errors.push(`${fieldIndex}: options must be null for non-select types`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

