import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BloodSample } from '../entities/blood-sample.entity';

@Injectable()
export class SampleIdService {
  constructor(
    @InjectRepository(BloodSample)
    private bloodSamplesRepository: Repository<BloodSample>,
  ) {}

  async generateSampleId(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    const prefix = `BL-${dateStr}-`;

    // Find the highest sequential number for today
    const samplesToday = await this.bloodSamplesRepository
      .createQueryBuilder('sample')
      .where('sample.sampleId LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('sample.sampleId', 'DESC')
      .getMany();

    let nextNumber = 1;
    if (samplesToday.length > 0) {
      const lastSampleId = samplesToday[0].sampleId;
      const lastNumberStr = lastSampleId.split('-')[2];
      const lastNumber = parseInt(lastNumberStr, 10);
      nextNumber = lastNumber + 1;
    }

    // Ensure 4-digit format with leading zeros
    const sequentialNumber = nextNumber.toString().padStart(4, '0');

    const sampleId = `${prefix}${sequentialNumber}`;

    // Double-check uniqueness (race condition protection)
    const existing = await this.bloodSamplesRepository.findOne({
      where: { sampleId },
    });

    if (existing) {
      // If somehow exists, try next number
      return this.generateSampleId();
    }

    return sampleId;
  }
}





