import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Package } from '../../packages/entities/package.entity';
import { Test } from '../../tests/entities/test.entity';

@Injectable()
export class PriceCalculationService {
  constructor(
    @InjectRepository(Package)
    private packagesRepository: Repository<Package>,
    @InjectRepository(Test)
    private testsRepository: Repository<Test>,
  ) {}

  /**
   * Calculate total price for a patient package
   * Total = Package price (if provided) + Sum of test prices (currently 0 as tests don't have prices)
   */
  async calculateTotalPrice(packageId: string | null | undefined, testIds: string[] = []): Promise<number> {
    let totalPrice = 0;

    // Get package price if packageId is provided
    if (packageId) {
      const pkg = await this.packagesRepository.findOne({
        where: { id: packageId },
      });

      if (!pkg) {
        throw new NotFoundException('Package not found');
      }

      if (!pkg.isActive) {
        throw new NotFoundException('Package is not active');
      }

      totalPrice = parseFloat(pkg.price.toString());
    }

    // Add test prices (currently 0 as tests don't have individual prices in schema)
    if (testIds && testIds.length > 0) {
      const tests = await this.testsRepository.find({
        where: testIds.map((id) => ({ id, isActive: true })),
      });

      if (tests.length !== testIds.length) {
        throw new NotFoundException('One or more tests not found or not active');
      }

      // Note: Tests don't have a price field in the schema
      // For now, we'll use 0 for individual test prices
      // In a real system, you might want to add a price field to tests table
      // or use a pricing table
      const testPrice = 0; // Placeholder - tests don't have prices in current schema
      totalPrice += testPrice;
    }

    return totalPrice;
  }
}

