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
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { QueryPatientsDto } from './dto/query-patients.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PatientResponseDto } from './dto/patient-response.dto';
import { PaginatedPatientsResponseDto } from './dto/paginated-patients-response.dto';
import { PaginatedPatientProgressResponseDto } from './dto/patient-progress-response.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Patients')
@Controller('patients')
@ApiBearerAuth('JWT-auth')
@UseGuards(RolesGuard)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post('register')
  @Roles(UserRole.RECEPTIONIST, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new patient (RECEPTIONIST, SUPER_ADMIN only)' })
  @ApiResponse({ status: 201, description: 'Patient registered successfully', type: PatientResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Forbidden - RECEPTIONIST or SUPER_ADMIN only' })
  @ApiResponse({ status: 404, description: 'Package or addon test not found' })
  async register(
    @Body() createPatientDto: CreatePatientDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<PatientResponseDto> {
    return this.patientsService.register(createPatientDto, user.userId, user.role);
  }

  @Get()
  @Roles(UserRole.RECEPTIONIST, UserRole.SUPER_ADMIN, UserRole.DOCTOR, UserRole.TEST_TECHNICIAN, UserRole.LAB_TECHNICIAN)
  @ApiOperation({ summary: 'Get all patients with pagination and filters (RECEPTIONIST, SUPER_ADMIN, DOCTOR, TEST_TECHNICIAN, LAB_TECHNICIAN)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'dateFrom', required: false, type: String })
  @ApiQuery({ name: 'dateTo', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Paginated list of patients', type: PaginatedPatientsResponseDto })
  async findAll(@Query() query: QueryPatientsDto): Promise<PaginatedPatientsResponseDto> {
    return this.patientsService.findAll(query);
  }

  @Get('progress')
  @Roles(UserRole.RECEPTIONIST, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all patients with progress details (RECEPTIONIST, SUPER_ADMIN only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'dateFrom', required: false, type: String })
  @ApiQuery({ name: 'dateTo', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Paginated list of patients with progress', type: PaginatedPatientProgressResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden - RECEPTIONIST or SUPER_ADMIN only' })
  async getProgress(@Query() query: QueryPatientsDto): Promise<PaginatedPatientProgressResponseDto> {
    return this.patientsService.getPatientProgress(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get patient by ID (All authenticated users)' })
  @ApiParam({ name: 'id', description: 'Patient UUID' })
  @ApiResponse({ status: 200, description: 'Patient details with package info', type: PatientResponseDto })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async findOne(@Param('id') id: string): Promise<PatientResponseDto> {
    return this.patientsService.findById(id);
  }

  @Get('by-patient-id/:patientId')
  @ApiOperation({ summary: 'Get patient by patient ID (PAT-YYYYMMDD-XXXX) (All authenticated users)' })
  @ApiParam({ name: 'patientId', description: 'Patient ID (e.g., PAT-20241110-0001)' })
  @ApiResponse({ status: 200, description: 'Patient details', type: PatientResponseDto })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async findByPatientId(@Param('patientId') patientId: string): Promise<PatientResponseDto> {
    return this.patientsService.findByPatientId(patientId);
  }

  @Put(':id')
  @Roles(UserRole.RECEPTIONIST, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update patient information (RECEPTIONIST, SUPER_ADMIN only)' })
  @ApiParam({ name: 'id', description: 'Patient UUID' })
  @ApiResponse({ status: 200, description: 'Patient updated successfully', type: PatientResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Forbidden - RECEPTIONIST or SUPER_ADMIN only' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async update(
    @Param('id') id: string,
    @Body() updatePatientDto: UpdatePatientDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<PatientResponseDto> {
    return this.patientsService.update(id, updatePatientDto, user.userId);
  }

  @Put(':id/payment')
  @Roles(UserRole.RECEPTIONIST, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update patient payment status (RECEPTIONIST, SUPER_ADMIN only)' })
  @ApiParam({ name: 'id', description: 'Patient UUID' })
  @ApiResponse({ status: 200, description: 'Payment updated successfully', type: PatientResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error or invalid payment amount' })
  @ApiResponse({ status: 403, description: 'Forbidden - RECEPTIONIST or SUPER_ADMIN only' })
  @ApiResponse({ status: 404, description: 'Patient or patient package not found' })
  async updatePayment(
    @Param('id') id: string,
    @Body() updatePaymentDto: UpdatePaymentDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<PatientResponseDto> {
    return this.patientsService.updatePayment(id, updatePaymentDto, user.userId);
  }
}

