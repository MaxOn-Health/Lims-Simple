import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportsService } from './reports.service';
import { Report } from './entities/report.entity';
import { Patient } from '../patients/entities/patient.entity';
import { Assignment } from '../assignments/entities/assignment.entity';
import { TestResult } from '../results/entities/test-result.entity';
import { DoctorReview } from '../doctor-reviews/entities/doctor-review.entity';
import { ReportNumberService } from './services/report-number.service';
import { PdfGenerationService } from './services/pdf-generation.service';
import { FileStorageService } from './services/file-storage.service';
import { AuditService } from '../audit/audit.service';
import { ProjectAccessService } from '../../common/services/project-access.service';
import { UserRole } from '../users/entities/user.entity';

describe('ReportsService', () => {
    let service: ReportsService;
    let reportsRepository: Repository<Report>;
    let projectAccessService: ProjectAccessService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ReportsService,
                {
                    provide: getRepositoryToken(Report),
                    useValue: {
                        find: jest.fn(),
                        findOne: jest.fn(),
                        create: jest.fn(),
                        save: jest.fn(),
                        createQueryBuilder: jest.fn(() => ({
                            leftJoinAndSelect: jest.fn().mockReturnThis(),
                            andWhere: jest.fn().mockReturnThis(),
                            orderBy: jest.fn().mockReturnThis(),
                            skip: jest.fn().mockReturnThis(),
                            take: jest.fn().mockReturnThis(),
                            getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
                        })),
                    },
                },
                {
                    provide: getRepositoryToken(Patient),
                    useValue: {
                        findOne: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(Assignment),
                    useValue: {
                        find: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(TestResult),
                    useValue: {
                        find: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(DoctorReview),
                    useValue: {
                        findOne: jest.fn(),
                    },
                },
                {
                    provide: ReportNumberService,
                    useValue: {
                        generateReportNumber: jest.fn(),
                    },
                },
                {
                    provide: PdfGenerationService,
                    useValue: {
                        generatePdf: jest.fn(),
                    },
                },
                {
                    provide: FileStorageService,
                    useValue: {
                        savePdf: jest.fn(),
                    },
                },
                {
                    provide: AuditService,
                    useValue: {
                        log: jest.fn(),
                    },
                },
                {
                    provide: ProjectAccessService,
                    useValue: {
                        canAccessProject: jest.fn().mockResolvedValue(true),
                        getUserProjectIds: jest.fn().mockResolvedValue(['project-1']),
                    },
                },
            ],
        }).compile();

        service = module.get<ReportsService>(ReportsService);
        reportsRepository = module.get<Repository<Report>>(getRepositoryToken(Report));
        projectAccessService = module.get<ProjectAccessService>(ProjectAccessService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findAll', () => {
        it('should call getUserProjectIds for non-superadmin', async () => {
            await service.findAll({}, 'user-1', UserRole.TEST_TECHNICIAN);
            expect(projectAccessService.getUserProjectIds).toHaveBeenCalledWith('user-1', UserRole.TEST_TECHNICIAN);
        });

        it('should not call getUserProjectIds for superadmin', async () => {
            await service.findAll({}, 'admin-1', UserRole.SUPER_ADMIN);
            expect(projectAccessService.getUserProjectIds).not.toHaveBeenCalled();
        });
    });
});
