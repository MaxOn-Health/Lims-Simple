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
   * Total = Package price + Sum of addon test prices
   */
  async calculateTotalPrice(packageId: string, addonTestIds: string[] = []): Promise<number> {
    // Get package price
    const pkg = await this.packagesRepository.findOne({
      where: { id: packageId },
    });

    if (!pkg) {
      throw new NotFoundException('Package not found');
    }

    if (!pkg.isActive) {
      throw new NotFoundException('Package is not active');
    }

    let totalPrice = parseFloat(pkg.price.toString());

    // Add addon test prices
    if (addonTestIds && addonTestIds.length > 0) {
      const addonTests = await this.testsRepository.find({
        where: addonTestIds.map((id) => ({ id, isActive: true })),
      });

      if (addonTests.length !== addonTestIds.length) {
        throw new NotFoundException('One or more addon tests not found or not active');
      }

      // Note: Tests don't have a price field in the schema
      // For now, we'll use 0 for addon tests
      // In a real system, you might want to add a price field to tests table
      // or use a pricing table
      const addonPrice = 0; // Placeholder - tests don't have prices in current schema
      totalPrice += addonPrice;
    }

    return totalPrice;
  }
}

