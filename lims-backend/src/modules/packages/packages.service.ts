import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Package } from './entities/package.entity';
import { PackageTest } from './entities/package-test.entity';
import { PatientPackage } from '../patients/entities/patient-package.entity';
import { Test } from '../tests/entities/test.entity';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { QueryPackagesDto } from './dto/query-packages.dto';
import { AddTestToPackageDto } from './dto/add-test-to-package.dto';

@Injectable()
export class PackagesService {
  constructor(
    @InjectRepository(Package)
    private packagesRepository: Repository<Package>,
    @InjectRepository(PackageTest)
    private packageTestsRepository: Repository<PackageTest>,
    @InjectRepository(Test)
    private testsRepository: Repository<Test>,
    @InjectRepository(PatientPackage)
    private patientPackagesRepository: Repository<PatientPackage>,
  ) { }

  async create(createPackageDto: CreatePackageDto): Promise<Package> {
    // Check if package name already exists
    const existingPackage = await this.packagesRepository.findOne({
      where: { name: createPackageDto.name },
    });

    if (existingPackage) {
      throw new ConflictException('Package name already exists');
    }

    const pkg = this.packagesRepository.create({
      name: createPackageDto.name,
      description: createPackageDto.description || null,
      price: createPackageDto.price,
      validityDays: createPackageDto.validityDays || 365,
      isActive: true,
    });

    return this.packagesRepository.save(pkg);
  }

  async findAll(query: QueryPackagesDto): Promise<Package[]> {
    const where: any = {};

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    return this.packagesRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Package | null> {
    return this.packagesRepository.findOne({
      where: { id },
      relations: ['packageTests', 'packageTests.test'],
    });
  }

  async update(id: string, updatePackageDto: UpdatePackageDto): Promise<Package> {
    const pkg = await this.findById(id);
    if (!pkg) {
      throw new NotFoundException('Package not found');
    }

    // Check name uniqueness if name is being updated
    if (updatePackageDto.name && updatePackageDto.name !== pkg.name) {
      const existingPackage = await this.packagesRepository.findOne({
        where: { name: updatePackageDto.name },
      });
      if (existingPackage) {
        throw new ConflictException('Package name already exists');
      }
    }

    await this.packagesRepository.update(id, updatePackageDto);
    return this.findById(id);
  }

  async softDelete(id: string): Promise<void> {
    const pkg = await this.packagesRepository.findOne({ where: { id } });
    if (!pkg) {
      throw new NotFoundException('Package not found');
    }

    // Check if package is used by any patient
    const patientPackages = await this.patientPackagesRepository.find({
      where: { packageId: id },
      take: 1,
    });

    if (patientPackages.length > 0) {
      throw new BadRequestException('Cannot delete package that has been assigned to patients');
    }

    await this.packagesRepository.update(id, { isActive: false });
  }

  async addTestToPackage(packageId: string, addTestDto: AddTestToPackageDto): Promise<void> {
    const pkg = await this.packagesRepository.findOne({ where: { id: packageId } });
    if (!pkg) {
      throw new NotFoundException('Package not found');
    }

    const test = await this.testsRepository.findOne({
      where: { id: addTestDto.testId },
    });
    if (!test) {
      throw new NotFoundException('Test not found');
    }

    // Check if test is already in package
    const existingPackageTest = await this.packageTestsRepository.findOne({
      where: {
        packageId,
        testId: addTestDto.testId,
      },
    });

    if (existingPackageTest) {
      throw new ConflictException('Test is already in this package');
    }

    const packageTest = this.packageTestsRepository.create({
      packageId,
      testId: addTestDto.testId,
      testPrice: addTestDto.testPrice || null,
    });

    await this.packageTestsRepository.save(packageTest);
  }

  async removeTestFromPackage(packageId: string, testId: string): Promise<void> {
    const pkg = await this.packagesRepository.findOne({ where: { id: packageId } });
    if (!pkg) {
      throw new NotFoundException('Package not found');
    }

    const packageTest = await this.packageTestsRepository.findOne({
      where: {
        packageId,
        testId,
      },
    });

    if (!packageTest) {
      throw new NotFoundException('Test not found in this package');
    }

    await this.packageTestsRepository.remove(packageTest);
  }

  async getPackageTests(packageId: string): Promise<PackageTest[]> {
    const pkg = await this.packagesRepository.findOne({ where: { id: packageId } });
    if (!pkg) {
      throw new NotFoundException('Package not found');
    }

    return this.packageTestsRepository.find({
      where: { packageId },
      relations: ['test'],
      order: { createdAt: 'ASC' },
    });
  }
}

