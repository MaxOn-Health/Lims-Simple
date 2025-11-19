import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from '../entities/patient.entity';

@Injectable()
export class PatientIdService {
  constructor(
    @InjectRepository(Patient)
    private patientsRepository: Repository<Patient>,
  ) {}

  /**
   * Generate unique patient ID in format: PAT-YYYYMMDD-XXXX or CUSTOM-PREFIX-YYYYMMDD-XXXX
   * Where XXXX is a 4-digit sequential number that resets daily
   * @param customPrefix Optional custom prefix (e.g., "CAMP2025")
   */
  async generatePatientId(customPrefix?: string): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
    const basePrefix = customPrefix ? `${customPrefix}-${dateStr}-` : `PAT-${dateStr}-`;
    const prefix = basePrefix;

    // Find the highest sequence number for today
    const existingPatients = await this.patientsRepository
      .createQueryBuilder('patient')
      .where('patient.patientId LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('patient.patientId', 'DESC')
      .getMany();

    let sequence = 1;

    if (existingPatients.length > 0) {
      // Extract the sequence number from the last patient ID
      const lastPatientId = existingPatients[0].patientId;
      const lastSequenceStr = lastPatientId.split('-')[2];
      const lastSequence = parseInt(lastSequenceStr, 10);

      if (!isNaN(lastSequence)) {
        sequence = lastSequence + 1;
      }
    }

    // Format sequence as 4-digit string with leading zeros
    const sequenceStr = sequence.toString().padStart(4, '0');
    const patientId = `${prefix}${sequenceStr}`;

    // Double-check uniqueness (in case of race condition)
    const existing = await this.patientsRepository.findOne({
      where: { patientId },
    });

    if (existing) {
      // If conflict, increment and try again
      return this.generatePatientId();
    }

    return patientId;
  }
}

