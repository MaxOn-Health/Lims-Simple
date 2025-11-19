import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { PriceCalculationService } from './price-calculation.service';
import { Package } from '../../packages/entities/package.entity';
import { Test as TestEntity } from '../../tests/entities/test.entity';

describe('PriceCalculationService', () => {
  let service: PriceCalculationService;
  let packagesRepository: Repository<Package>;
  let testsRepository: Repository<TestEntity>;

  const mockPackage: Package = {
    id: 'pkg-1',
    name: 'Test Package',
    description: 'Test',
    price: 1000.0,
    validityDays: 365,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    packageTests: [],
  };

  const mockTest: TestEntity = {
    id: 'test-1',
    name: 'Test Test',
    description: 'Test',
    category: 'lab' as any,
    adminRole: 'LAB_TECHNICIAN',
    normalRangeMin: null,
    normalRangeMax: null,
    unit: null,
    testFields: [],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    packageTests: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PriceCalculationService,
        {
          provide: getRepositoryToken(Package),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(TestEntity),
          useValue: {
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PriceCalculationService>(PriceCalculationService);
    packagesRepository = module.get<Repository<Package>>(getRepositoryToken(Package));
    testsRepository = module.get<Repository<TestEntity>>(getRepositoryToken(TestEntity));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateTotalPrice', () => {
    it('should calculate total price with package only', async () => {
      jest.spyOn(packagesRepository, 'findOne').mockResolvedValue(mockPackage);

      const totalPrice = await service.calculateTotalPrice('pkg-1', []);

      expect(totalPrice).toBe(1000.0);
      expect(packagesRepository.findOne).toHaveBeenCalledWith({ where: { id: 'pkg-1' } });
    });

    it('should calculate total price with package and addon tests', async () => {
      jest.spyOn(packagesRepository, 'findOne').mockResolvedValue(mockPackage);
      jest.spyOn(testsRepository, 'find').mockResolvedValue([mockTest]);

      const totalPrice = await service.calculateTotalPrice('pkg-1', ['test-1']);

      expect(totalPrice).toBe(1000.0); // Package price + 0 (tests don't have prices)
      expect(testsRepository.find).toHaveBeenCalledWith({
        where: [{ id: 'test-1', isActive: true }],
      });
    });

    it('should throw NotFoundException if package not found', async () => {
      jest.spyOn(packagesRepository, 'findOne').mockResolvedValue(null);

      await expect(service.calculateTotalPrice('non-existent', [])).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if package is not active', async () => {
      const inactivePackage = { ...mockPackage, isActive: false };
      jest.spyOn(packagesRepository, 'findOne').mockResolvedValue(inactivePackage);

      await expect(service.calculateTotalPrice('pkg-1', [])).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if addon test not found', async () => {
      jest.spyOn(packagesRepository, 'findOne').mockResolvedValue(mockPackage);
      jest.spyOn(testsRepository, 'find').mockResolvedValue([]); // No tests found

      await expect(service.calculateTotalPrice('pkg-1', ['test-1'])).rejects.toThrow(NotFoundException);
    });
  });
});

