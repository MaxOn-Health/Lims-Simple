import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { DoctorReviewsService } from './doctor-reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { SignReportDto } from './dto/sign-report.dto';
import { QueryPatientsDto } from './dto/query-patients.dto';
import { ReviewResponseDto } from './dto/review-response.dto';
import { PatientReviewResponseDto, PaginatedPatientsResponseDto } from './dto/patient-review-response.dto';
import { PatientResultsResponseDto } from './dto/review-response.dto';

@ApiTags('Doctor Reviews')
@Controller('doctor')
@ApiBearerAuth('JWT-auth')
@UseGuards(RolesGuard)
export class DoctorReviewsController {
  constructor(private readonly doctorReviewsService: DoctorReviewsService) { }

  @Get('patients')
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Get patients ready for review' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['PENDING', 'REVIEWED', 'SIGNED'],
    description: 'Filter by review status',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by patient name or patient ID',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
  })
  @ApiResponse({
    status: 200,
    description: 'List of patients ready for review',
    type: PaginatedPatientsResponseDto,
  })
  async getPatientsForReview(
    @Query() queryDto: QueryPatientsDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<PaginatedPatientsResponseDto> {
    return this.doctorReviewsService.findPatientsForReview(user.userId, queryDto, user.role as UserRole);
  }

  @Get('patient/:patientId/results')
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Get patient results for review' })
  @ApiParam({ name: 'patientId', description: 'Patient UUID' })
  @ApiResponse({
    status: 200,
    description: 'Patient details with all test results',
    type: PatientResultsResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async getPatientResults(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<PatientResultsResponseDto> {
    return this.doctorReviewsService.getPatientResults(patientId, user.userId, user.role as UserRole);
  }

  @Post('review')
  @Roles(UserRole.DOCTOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create or update doctor review' })
  @ApiResponse({
    status: 201,
    description: 'Review created/updated successfully',
    type: ReviewResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - all tests must be SUBMITTED' })
  async createOrUpdateReview(
    @Body() createReviewDto: CreateReviewDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ReviewResponseDto> {
    return this.doctorReviewsService.createOrUpdateReview(createReviewDto, user.userId, user.role as UserRole);
  }

  @Post('sign-report')
  @Roles(UserRole.DOCTOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign report with passkey' })
  @ApiResponse({
    status: 200,
    description: 'Report signed successfully',
    type: ReviewResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - review must exist and passkey must be verified' })
  async signReport(
    @Body() signReportDto: SignReportDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ReviewResponseDto> {
    return this.doctorReviewsService.signReport(signReportDto, user.userId, user.role as UserRole);
  }

  @Get('signed-reports')
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Get signed reports' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'dateFrom',
    required: false,
    description: 'Filter from date (ISO date string)',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    description: 'Filter to date (ISO date string)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of signed reports',
    type: PaginatedPatientsResponseDto,
  })
  async getSignedReports(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @CurrentUser() user?: JwtPayload,
  ): Promise<PaginatedPatientsResponseDto> {
    const pageNum = page ? Number(page) : 1;
    const limitNum = limit ? Number(limit) : 10;
    const fromDate = dateFrom ? new Date(dateFrom) : undefined;
    const toDate = dateTo ? new Date(dateTo) : undefined;

    return this.doctorReviewsService.getSignedReports(
      user!.userId,
      pageNum,
      limitNum,
      fromDate,
      toDate,
      user!.role as UserRole,
    );
  }
}






