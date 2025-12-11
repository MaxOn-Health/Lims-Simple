import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PackagesService } from './packages.service';
import { Package } from './entities/package.entity';
import { PackageTest } from './entities/package-test.entity';
import { Test as TestEntity } from '../tests/entities/test.entity';
import { PatientPackage } from '../patients/entities/patient-package.entity';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { AddTestToPackageDto } from './dto/add-test-to-package.dto';

describe('PackagesService', () => {
  let service: PackagesService;
  let packagesRepository: Repository<Package>;
  let packageTestsRepository: Repository<PackageTest>;
  let testsRepository: Repository<TestEntity>;

  const mockPackage: Package = {
    id: '123',
    name: 'Test Package',
    description: 'Test Description',
    price: 1000.0,
    validityDays: 365,
    isActive: true,
    packageTests: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTest: TestEntity = {
    id: 'test-123',
    name: 'Blood Test',
    description: 'Test description',
    category: 'lab' as any,
    adminRole: 'audiometry',
    normalRangeMin: null,
    normalRangeMax: null,
    unit: null,
    testFields: [],
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
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PackagesService,
        {
          provide: getRepositoryToken(Package),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(PackageTest),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(TestEntity),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(PatientPackage),
          useValue: {
            find: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    service = module.get<PackagesService>(PackagesService);
    packagesRepository = module.get<Repository<Package>>(getRepositoryToken(Package));
    packageTestsRepository = module.get<Repository<PackageTest>>(getRepositoryToken(PackageTest));
    testsRepository = module.get<Repository<TestEntity>>(getRepositoryToken(TestEntity));
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreatePackageDto = {
      name: 'New Package',
      description: 'New Description',
      price: 1500.0,
      validityDays: 180,
    };

    it('should create a new package', async () => {
      jest.spyOn(packagesRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(packagesRepository, 'create').mockReturnValue(mockPackage);
      jest.spyOn(packagesRepository, 'save').mockResolvedValue(mockPackage);

      const result = await service.create(createDto);

      expect(result).toEqual(mockPackage);
      expect(packagesRepository.create).toHaveBeenCalled();
      expect(packagesRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if package name already exists', async () => {
      jest.spyOn(packagesRepository, 'findOne').mockResolvedValue(mockPackage);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
      expect(packagesRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all packages', async () => {
      jest.spyOn(packagesRepository, 'find').mockResolvedValue([mockPackage]);

      const result = await service.findAll({});

      expect(result).toEqual([mockPackage]);
    });

    it('should filter by isActive', async () => {
      jest.spyOn(packagesRepository, 'find').mockResolvedValue([mockPackage]);

      await service.findAll({ isActive: true });

      expect(packagesRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findById', () => {
    it('should return package with tests', async () => {
      const packageWithTests = { ...mockPackage, packageTests: [] };
      jest.spyOn(packagesRepository, 'findOne').mockResolvedValue(packageWithTests);

      const result = await service.findById('123');

      expect(result).toEqual(packageWithTests);
      expect(packagesRepository.findOne).toHaveBeenCalledWith({
        where: { id: '123' },
        relations: ['packageTests', 'packageTests.test'],
      });
    });

    it('should return null when package not found', async () => {
      jest.spyOn(packagesRepository, 'findOne').mockResolvedValue(null);

      const result = await service.findById('invalid-id');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    const updateDto: UpdatePackageDto = {
      name: 'Updated Package',
      price: 2000.0,
    };

    it('should update package', async () => {
      const updatedPackage = { ...mockPackage, ...updateDto };
      jest.spyOn(service, 'findById').mockResolvedValue(mockPackage);
      jest.spyOn(packagesRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(packagesRepository, 'update').mockResolvedValue(undefined as any);
      jest.spyOn(service, 'findById').mockResolvedValue(updatedPackage);

      const result = await service.update('123', updateDto);

      expect(result).toEqual(updatedPackage);
      expect(packagesRepository.update).toHaveBeenCalledWith('123', updateDto);
    });

    it('should throw NotFoundException if package not found', async () => {
      jest.spyOn(service, 'findById').mockResolvedValue(null);

      await expect(service.update('invalid-id', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should check name uniqueness when name is updated', async () => {
      const existingPackage = { ...mockPackage, name: 'Existing Package' };
      jest.spyOn(service, 'findById').mockResolvedValue(mockPackage);
      jest.spyOn(packagesRepository, 'findOne').mockResolvedValue(existingPackage);

      await expect(
        service.update('123', { name: 'Existing Package' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('softDelete', () => {
    it('should soft delete package', async () => {
      jest.spyOn(packagesRepository, 'findOne').mockResolvedValue(mockPackage);
      jest.spyOn(packagesRepository, 'update').mockResolvedValue(undefined as any);

      await service.softDelete('123');

      expect(packagesRepository.update).toHaveBeenCalledWith('123', { isActive: false });
    });

    it('should throw NotFoundException if package not found', async () => {
      jest.spyOn(packagesRepository, 'findOne').mockResolvedValue(null);

      await expect(service.softDelete('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('addTestToPackage', () => {
    const addTestDto: AddTestToPackageDto = {
      testId: 'test-123',
      testPrice: 500.0,
    };

    it('should add test to package', async () => {
      const packageId = '123';
      const packageWithId = { ...mockPackage, id: packageId };

      mockRepository.findOne
        .mockResolvedValueOnce(packageWithId) // First call for package
        .mockResolvedValueOnce(mockTest) // Second call for test
        .mockResolvedValueOnce(null); // Third call for existing package test check
      mockRepository.create.mockReturnValue({} as PackageTest);
      mockRepository.save.mockResolvedValue({} as PackageTest);

      await service.addTestToPackage(packageId, addTestDto);

      expect(mockRepository.findOne).toHaveBeenCalledTimes(3);
      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if package not found', async () => {
      jest.spyOn(packagesRepository, 'findOne').mockResolvedValue(null);

      await expect(service.addTestToPackage('invalid-id', addTestDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if test not found', async () => {
      jest.spyOn(packagesRepository, 'findOne').mockResolvedValue(mockPackage);
      jest.spyOn(testsRepository, 'findOne').mockResolvedValue(null);

      await expect(service.addTestToPackage('123', addTestDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if test already in package', async () => {
      const existingPackageTest = { id: 'pt-123' } as PackageTest;
      jest.spyOn(packagesRepository, 'findOne').mockResolvedValue(mockPackage);
      jest.spyOn(testsRepository, 'findOne').mockResolvedValue(mockTest);
      jest.spyOn(packageTestsRepository, 'findOne').mockResolvedValue(existingPackageTest);

      await expect(service.addTestToPackage('123', addTestDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('removeTestFromPackage', () => {
    it('should remove test from package', async () => {
      const packageTest = { id: 'pt-123' } as PackageTest;
      jest.spyOn(packagesRepository, 'findOne').mockResolvedValue(mockPackage);
      jest.spyOn(packageTestsRepository, 'findOne').mockResolvedValue(packageTest);
      jest.spyOn(packageTestsRepository, 'remove').mockResolvedValue(packageTest);

      await service.removeTestFromPackage('123', 'test-123');

      expect(packageTestsRepository.remove).toHaveBeenCalledWith(packageTest);
    });

    it('should throw NotFoundException if package not found', async () => {
      jest.spyOn(packagesRepository, 'findOne').mockResolvedValue(null);

      await expect(service.removeTestFromPackage('invalid-id', 'test-123')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if test not in package', async () => {
      jest.spyOn(packagesRepository, 'findOne').mockResolvedValue(mockPackage);
      jest.spyOn(packageTestsRepository, 'findOne').mockResolvedValue(null);

      await expect(service.removeTestFromPackage('123', 'test-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getPackageTests', () => {
    it('should return package tests', async () => {
      const packageTests = [{ id: 'pt-123' }] as PackageTest[];
      jest.spyOn(packagesRepository, 'findOne').mockResolvedValue(mockPackage);
      jest.spyOn(packageTestsRepository, 'find').mockResolvedValue(packageTests);

      const result = await service.getPackageTests('123');

      expect(result).toEqual(packageTests);
      expect(packageTestsRepository.find).toHaveBeenCalledWith({
        where: { packageId: '123' },
        relations: ['test'],
        order: { createdAt: 'ASC' },
      });
    });

    it('should throw NotFoundException if package not found', async () => {
      jest.spyOn(packagesRepository, 'findOne').mockResolvedValue(null);

      await expect(service.getPackageTests('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });
});

