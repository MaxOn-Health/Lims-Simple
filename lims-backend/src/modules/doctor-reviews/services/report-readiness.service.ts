import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assignment } from '../../assignments/entities/assignment.entity';
import { AssignmentStatus } from '../../assignments/constants/assignment-status.enum';
import { TestResult } from '../../results/entities/test-result.entity';
import { BloodSample } from '../../blood-samples/entities/blood-sample.entity';
import { BloodSampleStatus } from '../../blood-samples/constants/blood-sample-status.enum';
import { DoctorReview } from '../entities/doctor-review.entity';

@Injectable()
export class ReportReadinessService {
  constructor(
    @InjectRepository(Assignment)
    private assignmentsRepository: Repository<Assignment>,
    @InjectRepository(TestResult)
    private testResultsRepository: Repository<TestResult>,
    @InjectRepository(BloodSample)
    private bloodSamplesRepository: Repository<BloodSample>,
    @InjectRepository(DoctorReview)
    private doctorReviewsRepository: Repository<DoctorReview>,
  ) {}

  async checkPatientReadiness(patientId: string): Promise<{
    isReady: boolean;
    details: {
      allAssignmentsSubmitted: boolean;
      allResultsExist: boolean;
      bloodTestCompleted: boolean;
      reviewExists: boolean;
      isSigned: boolean;
    };
  }> {
    // Get all assignments for patient
    const assignments = await this.assignmentsRepository.find({
      where: { patientId },
    });

    // Check if all assignments are SUBMITTED
    const allAssignmentsSubmitted = assignments.every(
      (a) => a.status === AssignmentStatus.SUBMITTED,
    );

    // Check if all test_results exist
    const assignmentIds = assignments.map((a) => a.id);
    const results =
      assignmentIds.length > 0
        ? await this.testResultsRepository.find({
            where: assignmentIds.map((id) => ({ assignmentId: id })),
          })
        : [];
    const allResultsExist = results.length === assignments.length;

    // Check blood test status if applicable
    const bloodSample = await this.bloodSamplesRepository.findOne({
      where: { patientId },
    });
    const bloodTestCompleted =
      !bloodSample || bloodSample.status === BloodSampleStatus.COMPLETED;

    // Check doctor review exists
    const review = await this.doctorReviewsRepository.findOne({
      where: { patientId },
    });
    const reviewExists = !!review;
    const isSigned = review?.isSigned || false;

    const isReady =
      allAssignmentsSubmitted &&
      allResultsExist &&
      bloodTestCompleted &&
      reviewExists &&
      isSigned;

    return {
      isReady,
      details: {
        allAssignmentsSubmitted,
        allResultsExist,
        bloodTestCompleted,
        reviewExists,
        isSigned,
      },
    };
  }
}

