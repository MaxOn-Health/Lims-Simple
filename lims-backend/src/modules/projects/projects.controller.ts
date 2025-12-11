import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { QueryProjectsDto } from './dto/query-projects.dto';
import { ProjectResponseDto } from './dto/project-response.dto';
import { ProjectMemberResponseDto } from './dto/project-member-response.dto';
import { AddProjectMemberDto } from './dto/add-project-member.dto';
import { PaginatedProjectsResponse } from './projects.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { ProjectStatus } from './constants/project-status.enum';
import { ProjectAccess } from '../../common/decorators/project-access.decorator';
import { ProjectAccessGuard } from '../../common/guards/project-access.guard';
import { RoleInProject } from './constants/role-in-project.enum';

@ApiTags('Projects')
@Controller('projects')
@ApiBearerAuth('JWT-auth')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) { }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new project (SUPER_ADMIN only)' })
  @ApiResponse({
    status: 201,
    description: 'Project created successfully',
    type: ProjectResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
  @ApiResponse({ status: 409, description: 'Project name already exists' })
  async create(@Body() createProjectDto: CreateProjectDto): Promise<ProjectResponseDto> {
    return this.projectsService.create(createProjectDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all projects with pagination and filters (all authenticated users)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ProjectStatus })
  @ApiQuery({ name: 'companyName', required: false, type: String })
  @ApiQuery({ name: 'startDateFrom', required: false, type: String })
  @ApiQuery({ name: 'startDateTo', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of projects',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/ProjectResponseDto' },
        },
        meta: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
            totalPages: { type: 'number' },
          },
        },
      },
    },
  })
  async findAll(@Query() query: QueryProjectsDto) {
    return this.projectsService.findAll(query);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active projects (for receptionist use)' })
  @ApiResponse({
    status: 200,
    description: 'List of active projects',
    type: [ProjectResponseDto],
  })
  async getActiveProjects(): Promise<ProjectResponseDto[]> {
    return this.projectsService.getActiveProjects();
  }

  @Get(':id')
  @UseGuards(RolesGuard, ProjectAccessGuard)
  @ApiOperation({ summary: 'Get project by ID' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  // Super Admins, Project Members, Project Leads can view
  @ApiResponse({
    status: 200,
    description: 'Project details',
    type: ProjectResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Project not found' })
  findOne(@Param('id') id: string) {
    return this.projectsService.findById(id);
  }

  @Patch(':id') // Changed from @Put to @Patch
  @UseGuards(RolesGuard, ProjectAccessGuard)
  @ProjectAccess([RoleInProject.LEAD]) // Only Project Leads or Super Admins
  @ApiOperation({ summary: 'Update project (SUPER_ADMIN or Project Lead only)' }) // Updated summary
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({
    status: 200,
    description: 'Project updated successfully',
    type: ProjectResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN or Project Lead only' }) // Updated description
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 409, description: 'Project name already exists' })
  update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, updateProjectDto);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update project status (SUPER_ADMIN only)' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiQuery({ name: 'status', enum: ProjectStatus, required: true })
  @ApiResponse({
    status: 200,
    description: 'Project status updated successfully',
    type: ProjectResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async updateStatus(
    @Param('id') id: string,
    @Query('status') status: ProjectStatus,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.updateStatus(id, status);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete project (SUPER_ADMIN only)' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({
    status: 200,
    description: 'Project deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Project deleted successfully' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Cannot delete project with patients' })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.projectsService.delete(id);
    return { message: 'Project deleted successfully' };
  }

  // ─────────────────────────────────────────────
  // Member Management Endpoints
  // ─────────────────────────────────────────────

  @Get(':id/members')
  @UseGuards(RolesGuard, ProjectAccessGuard)
  @ApiOperation({ summary: 'Get all members of a project' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  // Any member can view other members
  @ApiResponse({
    status: 200,
    description: 'List of project members',
    type: [ProjectMemberResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Project not found' })
  getProjectMembers(@Param('id') id: string) {
    return this.projectsService.getProjectMembers(id);
  }

  @Post(':id/members')
  @UseGuards(RolesGuard, ProjectAccessGuard)
  @ProjectAccess([RoleInProject.LEAD]) // Leads can add members
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a member to a project (SUPER_ADMIN or Project Lead only)' }) // Updated summary
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({
    status: 201,
    description: 'Member added successfully',
    type: ProjectMemberResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN or Project Lead only' }) // Updated description
  @ApiResponse({ status: 404, description: 'Project or user not found' })
  @ApiResponse({ status: 409, description: 'User is already a member of this project' })
  async addMember(
    @Param('id') id: string,
    @Body() dto: AddProjectMemberDto,
  ): Promise<ProjectMemberResponseDto> {
    return this.projectsService.addMember(id, dto);
  }

  @Delete(':id/members/:userId')
  @UseGuards(RolesGuard, ProjectAccessGuard)
  @ProjectAccess([RoleInProject.LEAD]) // Leads can remove members
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a member from a project (SUPER_ADMIN or Project Lead only)' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiParam({ name: 'userId', description: 'User ID to remove' })
  @ApiResponse({
    status: 200,
    description: 'Member removed successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Member removed successfully' },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN or Project Lead only' })
  @ApiResponse({ status: 404, description: 'Member not found in this project' })
  async removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
  ): Promise<{ message: string }> {
    return this.projectsService.removeMember(id, userId);
  }

  @Get('user/:userId/projects')
  @ApiOperation({ summary: 'Get all projects for a specific user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'List of projects for the user',
    type: [ProjectResponseDto],
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getProjectsForUser(@Param('userId') userId: string): Promise<ProjectResponseDto[]> {
    return this.projectsService.getProjectsForUser(userId);
  }
}
