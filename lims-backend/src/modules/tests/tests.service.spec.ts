import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { TestsService } from './tests.service';
import { Test as TestEntity, TestField } from './entities/test.entity';
import { PackageTest } from '../packages/entities/package-test.entity';
import { TestCategory } from './constants/test-category';
import { TestFieldType } from './constants/test-field-types';
import { CreateTestDto } from './dto/create-test.dto';
import { UpdateTestDto } from './dto/update-test.dto';

describe('TestsService', () => {
  let service: TestsService;
  let testsRepository: Repository<TestEntity>;
  let packageTestsRepository: Repository<PackageTest>;

  const mockTestFields: TestField[] = [
    {
      field_name: 'result_value',
      field_type: TestFieldType.NUMBER,
      required: true,
      options: null,
    },
  ];

  const mockTest: TestEntity = {
    id: '123',
    name: 'Blood Test',
    description: 'Test description',
    category: TestCategory.LAB,
    adminRole: 'audiometry',
    normalRangeMin: 4.5,
    normalRangeMax: 11.0,
    unit: 'g/dL',
    testFields: mockTestFields,
    isActive: true,
    packageTests: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TestsService,
        {
          provide: getRepositoryToken(TestEntity),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(PackageTest),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<TestsService>(TestsService);
    testsRepository = module.get<Repository<TestEntity>>(getRepositoryToken(TestEntity));
    packageTestsRepository = module.get<Repository<PackageTest>>(getRepositoryToken(PackageTest));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateTestDto = {
      name: 'New Test',
      description: 'New description',
      category: TestCategory.ON_SITE,
      adminRole: 'xray',
      normalRangeMin: 5.0,
      normalRangeMax: 10.0,
      unit: 'mg/dL',
      testFields: mockTestFields,
    };

    it('should create a new test', async () => {
      jest.spyOn(testsRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(testsRepository, 'create').mockReturnValue(mockTest);
      jest.spyOn(testsRepository, 'save').mockResolvedValue(mockTest);

      const result = await service.create(createDto);

      expect(result).toEqual(mockTest);
      expect(testsRepository.create).toHaveBeenCalled();
      expect(testsRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if test name already exists', async () => {
      jest.spyOn(testsRepository, 'findOne').mockResolvedValue(mockTest);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if normal range min >= max', async () => {
      const invalidDto = { ...createDto, normalRangeMin: 10.0, normalRangeMax: 5.0 };
      jest.spyOn(testsRepository, 'findOne').mockResolvedValue(null);

      await expect(service.create(invalidDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return all tests', async () => {
      jest.spyOn(testsRepository, 'find').mockResolvedValue([mockTest]);

      const result = await service.findAll({});

      expect(result).toEqual([mockTest]);
    });

    it('should filter by category', async () => {
      jest.spyOn(testsRepository, 'find').mockResolvedValue([mockTest]);

      await service.findAll({ category: TestCategory.LAB });

      expect(testsRepository.find).toHaveBeenCalledWith({
        where: { category: TestCategory.LAB },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findById', () => {
    it('should return test by ID', async () => {
      jest.spyOn(testsRepository, 'findOne').mockResolvedValue(mockTest);

      const result = await service.findById('123');

      expect(result).toEqual(mockTest);
    });

    it('should return null when test not found', async () => {
      jest.spyOn(testsRepository, 'findOne').mockResolvedValue(null);

      const result = await service.findById('invalid-id');

      expect(result).toBeNull();
    });
  });

  describe('findByAdminRole', () => {
    it('should return tests by admin role', async () => {
      jest.spyOn(testsRepository, 'find').mockResolvedValue([mockTest]);

      const result = await service.findByAdminRole('audiometry');

      expect(result).toEqual([mockTest]);
      expect(testsRepository.find).toHaveBeenCalledWith({
        where: { adminRole: 'audiometry', isActive: true },
        order: { name: 'ASC' },
      });
    });
  });

  describe('update', () => {
    const updateDto: UpdateTestDto = {
      name: 'Updated Test',
    };

    it('should update test', async () => {
      const updatedTest = { ...mockTest, ...updateDto };
      jest.spyOn(service, 'findById').mockResolvedValue(mockTest);
      jest.spyOn(testsRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(testsRepository, 'update').mockResolvedValue(undefined as any);
      jest.spyOn(service, 'findById').mockResolvedValue(updatedTest);

      const result = await service.update('123', updateDto);

      expect(result).toEqual(updatedTest);
      expect(testsRepository.update).toHaveBeenCalledWith('123', updateDto);
    });

    it('should throw NotFoundException if test not found', async () => {
      jest.spyOn(service, 'findById').mockResolvedValue(null);

      await expect(service.update('invalid-id', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('softDelete', () => {
    it('should soft delete test', async () => {
      jest.spyOn(service, 'findById').mockResolvedValue(mockTest);
      jest.spyOn(packageTestsRepository, 'find').mockResolvedValue([]);
      jest.spyOn(testsRepository, 'update').mockResolvedValue(undefined as any);

      await service.softDelete('123');

      expect(testsRepository.update).toHaveBeenCalledWith('123', { isActive: false });
    });

    it('should throw NotFoundException if test not found', async () => {
      jest.spyOn(service, 'findById').mockResolvedValue(null);

      await expect(service.softDelete('invalid-id')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if test is used in packages', async () => {
      const packageTest = { id: 'pt-123' } as PackageTest;
      jest.spyOn(service, 'findById').mockResolvedValue(mockTest);
      jest.spyOn(packageTestsRepository, 'find').mockResolvedValue([packageTest]);

      await expect(service.softDelete('123')).rejects.toThrow(BadRequestException);
    });
  });

  describe('validateTestFields', () => {
    it('should validate correct test fields', () => {
      const validFields: TestField[] = [
        {
          field_name: 'result',
          field_type: TestFieldType.NUMBER,
          required: true,
          options: null,
        },
      ];

      const result = service.validateTestFields(validFields);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty array', () => {
      const result = service.validateTestFields([]);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate select type requires options', () => {
      const invalidFields: TestField[] = [
        {
          field_name: 'choice',
          field_type: TestFieldType.SELECT,
          required: true,
          options: null,
        },
      ];

      const result = service.validateTestFields(invalidFields);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('select'))).toBe(true);
    });
  });
});

