import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from '../entities/report.entity';

@Injectable()
export class ReportNumberService {
  constructor(
    @InjectRepository(Report)
    private reportsRepository: Repository<Report>,
  ) {}

  /**
   * Generate unique report number in format: RPT-YYYYMMDD-XXXX
   * Where XXXX is a 4-digit sequential number that resets daily
   */
  async generateReportNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
    const prefix = `RPT-${dateStr}-`;

    // Find the highest sequence number for today
    const existingReports = await this.reportsRepository
      .createQueryBuilder('report')
      .where('report.reportNumber LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('report.reportNumber', 'DESC')
      .getMany();

    let sequence = 1;

    if (existingReports.length > 0) {
      // Extract the sequence number from the last report number
      const lastReportNumber = existingReports[0].reportNumber;
      const lastSequenceStr = lastReportNumber.split('-')[2];
      const lastSequence = parseInt(lastSequenceStr, 10);

      if (!isNaN(lastSequence)) {
        sequence = lastSequence + 1;
      }
    }

    // Format sequence as 4-digit string with leading zeros
    const sequenceStr = sequence.toString().padStart(4, '0');
    const reportNumber = `${prefix}${sequenceStr}`;

    // Double-check uniqueness (in case of race condition)
    const existing = await this.reportsRepository.findOne({
      where: { reportNumber },
    });

    if (existing) {
      // If conflict, increment and try again
      return this.generateReportNumber();
    }

    return reportNumber;
  }
}





