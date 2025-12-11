import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { ReassignAssignmentDto } from './dto/reassign-assignment.dto';
import { UpdateAssignmentStatusDto } from './dto/update-assignment-status.dto';
import { QueryAssignmentsDto } from './dto/query-assignments.dto';
import { AssignmentResponseDto } from './dto/assignment-response.dto';
import { AvailableTechnicianDto } from './dto/available-technician.dto';
import { AutoAssignRequestDto, AutoAssignPreviewItemDto } from './dto/auto-assign.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Assignments')
@Controller('assignments')
@ApiBearerAuth('JWT-auth')
@UseGuards(RolesGuard)
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) { }

  @Get('auto-assign/:patientId/preview')
  @Roles(UserRole.RECEPTIONIST, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Preview auto-assignment plan for a patient (RECEPTIONIST, SUPER_ADMIN only)' })
  @ApiParam({ name: 'patientId', description: 'Patient UUID' })
  @ApiResponse({
    status: 200,
    description: 'Preview of assignments to be created',
    type: [AutoAssignPreviewItemDto],
  })
  @ApiResponse({ status: 403, description: 'Forbidden - RECEPTIONIST or SUPER_ADMIN only' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async previewAutoAssign(
    @Param('patientId') patientId: string,
  ): Promise<AutoAssignPreviewItemDto[]> {
    return this.assignmentsService.previewAutoAssign(patientId);
  }

  @Post('auto-assign/:patientId')
  @Roles(UserRole.RECEPTIONIST, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Auto-assign tests to admins for a patient (RECEPTIONIST, SUPER_ADMIN only)' })
  @ApiParam({ name: 'patientId', description: 'Patient UUID' })
  @ApiResponse({
    status: 201,
    description: 'Tests assigned successfully',
    type: [AssignmentResponseDto],
  })
  @ApiResponse({ status: 400, description: 'Validation error or patient has no packages' })
  @ApiResponse({ status: 403, description: 'Forbidden - RECEPTIONIST or SUPER_ADMIN only' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async autoAssign(
    @Param('patientId') patientId: string,
    @Body() request: AutoAssignRequestDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<AssignmentResponseDto[]> {
    return this.assignmentsService.autoAssign(
      patientId,
      user.userId,
      request.overrides || {}
    );
  }

  @Post('manual-assign')
  @Roles(UserRole.RECEPTIONIST, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Manually assign a test to an admin (RECEPTIONIST, SUPER_ADMIN only)' })
  @ApiResponse({
    status: 201,
    description: 'Test assigned successfully',
    type: AssignmentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Forbidden - RECEPTIONIST or SUPER_ADMIN only' })
  @ApiResponse({ status: 404, description: 'Patient, test, or admin not found' })
  async manualAssign(
    @Body() createAssignmentDto: CreateAssignmentDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<AssignmentResponseDto> {
    return this.assignmentsService.manualAssign(createAssignmentDto, user.userId, user.role);
  }

  @Put(':id/reassign')
  @Roles(UserRole.RECEPTIONIST, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Reassign an assignment to a different admin (RECEPTIONIST, SUPER_ADMIN only)' })
  @ApiParam({ name: 'id', description: 'Assignment UUID' })
  @ApiResponse({
    status: 200,
    description: 'Assignment reassigned successfully',
    type: AssignmentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Forbidden - RECEPTIONIST or SUPER_ADMIN only' })
  @ApiResponse({ status: 404, description: 'Assignment or admin not found' })
  async reassign(
    @Param('id') id: string,
    @Body() reassignDto: ReassignAssignmentDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<AssignmentResponseDto> {
    return this.assignmentsService.reassign(id, reassignDto, user.userId, user.role);
  }

  @Get()
  @Roles(UserRole.RECEPTIONIST, UserRole.SUPER_ADMIN, UserRole.DOCTOR)
  @ApiOperation({
    summary: 'Get all assignments with optional filters (RECEPTIONIST, SUPER_ADMIN only)',
  })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'SUBMITTED'] })
  @ApiQuery({ name: 'patientId', required: false, type: String })
  @ApiQuery({ name: 'adminId', required: false, type: String })
  @ApiQuery({ name: 'testId', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'List of assignments',
    type: [AssignmentResponseDto],
  })
  @ApiResponse({ status: 403, description: 'Forbidden - RECEPTIONIST or SUPER_ADMIN only' })
  @ApiResponse({ status: 403, description: 'Forbidden - RECEPTIONIST or SUPER_ADMIN only' })
  async findAll(
    @Query() queryDto: QueryAssignmentsDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<AssignmentResponseDto[]> {
    const currentUser = { id: user.userId, role: user.role } as any;
    return this.assignmentsService.findAll(queryDto, currentUser);
  }

  @Get('available-technicians')
  @Roles(UserRole.RECEPTIONIST, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get available technicians for a test type, optionally filtered by project',
  })
  @ApiQuery({
    name: 'testId',
    required: true,
    type: String,
    description: 'Test ID to find matching technicians for',
  })
  @ApiQuery({
    name: 'projectId',
    required: false,
    type: String,
    description: 'Filter by project membership',
  })
  @ApiQuery({
    name: 'includeWorkload',
    required: false,
    type: Boolean,
    description: 'Include current assignment workload info (default: true)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of available technicians with workload info',
    type: [AvailableTechnicianDto],
  })
  @ApiResponse({ status: 403, description: 'Forbidden - RECEPTIONIST or SUPER_ADMIN only' })
  @ApiResponse({ status: 404, description: 'Test not found' })
  async getAvailableTechnicians(
    @Query('testId') testId: string,
    @Query('projectId') projectId?: string,
    @Query('includeWorkload') includeWorkload?: string,
  ): Promise<AvailableTechnicianDto[]> {
    const includeWorkloadBool = includeWorkload !== 'false';
    return this.assignmentsService.getAvailableTechnicians(
      testId,
      projectId,
      includeWorkloadBool,
    );
  }

  @Get('patient/:patientId')
  @ApiOperation({ summary: 'Get all assignments for a patient (All authenticated users)' })
  @ApiParam({ name: 'patientId', description: 'Patient UUID' })
  @ApiResponse({
    status: 200,
    description: 'List of assignments for patient',
    type: [AssignmentResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async findByPatient(@Param('patientId') patientId: string): Promise<AssignmentResponseDto[]> {
    return this.assignmentsService.findByPatient(patientId);
  }

  @Get('my-assignments')
  @Roles(UserRole.TEST_TECHNICIAN, UserRole.LAB_TECHNICIAN)
  @ApiOperation({
    summary: 'Get assignments for current user (TEST_TECHNICIAN, LAB_TECHNICIAN only)',
  })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'SUBMITTED'] })
  @ApiResponse({
    status: 200,
    description: 'List of assignments for current user',
    type: [AssignmentResponseDto],
  })
  async getMyAssignments(
    @Query('status') status: string | undefined,
    @CurrentUser() user: JwtPayload,
  ): Promise<AssignmentResponseDto[]> {
    const statusEnum = status ? (status as any) : undefined;
    const currentUser = { id: user.userId, role: user.role } as any;
    return this.assignmentsService.findByAdmin(user.userId, statusEnum, currentUser);
  }

  @Put(':id/status')
  @Roles(UserRole.TEST_TECHNICIAN, UserRole.LAB_TECHNICIAN)
  @ApiOperation({
    summary: 'Update assignment status (TEST_TECHNICIAN, LAB_TECHNICIAN - own assignments only)',
  })
  @ApiParam({ name: 'id', description: 'Assignment UUID' })
  @ApiResponse({
    status: 200,
    description: 'Assignment status updated successfully',
    type: AssignmentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 403, description: 'Forbidden - can only update own assignments' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateAssignmentStatusDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<AssignmentResponseDto> {
    return this.assignmentsService.updateStatus(id, updateStatusDto, user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get assignment by ID (All authenticated users)' })
  @ApiParam({ name: 'id', description: 'Assignment UUID' })
  @ApiResponse({
    status: 200,
    description: 'Assignment details',
    type: AssignmentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  async findById(@Param('id') id: string): Promise<AssignmentResponseDto> {
    return this.assignmentsService.findById(id);
  }
}

