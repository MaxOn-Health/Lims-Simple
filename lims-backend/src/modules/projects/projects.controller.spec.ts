import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { ProjectAccessService } from '../../common/services/project-access.service';
import { ProjectResponseDto } from './dto/project-response.dto';
import { ProjectStatus } from './constants/project-status.enum';

describe('ProjectsController', () => {
    let controller: ProjectsController;
    let projectsService: ProjectsService;

    const mockProject: ProjectResponseDto = {
        id: '123',
        name: 'Test Project',
        description: 'Description',
        status: ProjectStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
    } as ProjectResponseDto;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ProjectsController],
            providers: [
                {
                    provide: ProjectsService,
                    useValue: {
                        create: jest.fn().mockResolvedValue(mockProject),
                        findAll: jest.fn().mockResolvedValue({ data: [mockProject], meta: {} }),
                        findById: jest.fn().mockResolvedValue(mockProject),
                        update: jest.fn().mockResolvedValue(mockProject),
                        delete: jest.fn().mockResolvedValue(undefined),
                        getProjectMembers: jest.fn().mockResolvedValue([]),
                        addMember: jest.fn().mockResolvedValue({}),
                        removeMember: jest.fn().mockResolvedValue({ message: 'Success' }),
                        getProjectsForUser: jest.fn().mockResolvedValue([mockProject]),
                        getActiveProjects: jest.fn().mockResolvedValue([mockProject]),
                        updateStatus: jest.fn().mockResolvedValue(mockProject),
                    },
                },
                {
                    provide: ProjectAccessService,
                    useValue: {
                        canAccessProject: jest.fn().mockResolvedValue(true),
                        getMemberRole: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<ProjectsController>(ProjectsController);
        projectsService = module.get<ProjectsService>(ProjectsService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('findOne', () => {
        it('should return a project', async () => {
            await controller.findOne('123');
            expect(projectsService.findById).toHaveBeenCalledWith('123');
        });
    });

    describe('update', () => {
        it('should update a project', async () => {
            await controller.update('123', {});
            expect(projectsService.update).toHaveBeenCalledWith('123', {});
        });
    });

    describe('removeMember', () => {
        it('should remove a member', async () => {
            await controller.removeMember('123', '456');
            expect(projectsService.removeMember).toHaveBeenCalledWith('123', '456');
        });
    });
});
