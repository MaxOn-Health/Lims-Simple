import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Req,
  Res,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ReportsService } from './reports.service';
import { ReportResponseDto } from './dto/report-response.dto';
import { QueryReportsDto } from './dto/query-reports.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../modules/users/entities/user.entity';
import { UuidValidationPipe } from '../../common/pipes/uuid-validation.pipe';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('Reports')
@Controller('reports')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) { }

  @Post('generate/:patientId')
  @Roles(UserRole.RECEPTIONIST, UserRole.SUPER_ADMIN, UserRole.DOCTOR, UserRole.TEST_TECHNICIAN, UserRole.LAB_TECHNICIAN)
  @ApiOperation({ summary: 'Generate report for a patient' })
  @ApiParam({ name: 'patientId', description: 'Patient UUID' })
  @ApiResponse({
    status: 201,
    description: 'Report generated successfully',
    type: ReportResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async generateReport(
    @Param('patientId', UuidValidationPipe) patientId: string,
    @Req() req: Request,
  ): Promise<ReportResponseDto> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new NotFoundException('User not authenticated');
    }
    return this.reportsService.generateReport(patientId, userId, req.user['role'] as UserRole);
  }

  @Get('patient/:patientId')
  @ApiOperation({ summary: 'Get report by patient ID (All authenticated users)' })
  @ApiParam({ name: 'patientId', description: 'Patient UUID' })
  @ApiResponse({
    status: 200,
    description: 'Report found',
    type: ReportResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async getReportByPatient(
    @Param('patientId', UuidValidationPipe) patientId: string,
    @Req() req: Request,
  ): Promise<ReportResponseDto | null> {
    const user = req.user as any;
    const report = await this.reportsService.findByPatientWithRole(patientId, user.userId, user.role);
    if (!report) {
      throw new NotFoundException(`Report for patient ${patientId} not found`);
    }
    return report;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get report by ID (All authenticated users)' })
  @ApiParam({ name: 'id', description: 'Report UUID' })
  @ApiResponse({
    status: 200,
    description: 'Report found',
    type: ReportResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async getReportById(
    @Param('id', UuidValidationPipe) id: string,
    @Req() req: Request,
  ): Promise<ReportResponseDto> {
    const user = req.user as any;
    return this.reportsService.findById(id, user.userId, user.role);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download report PDF (All authenticated users)' })
  @ApiParam({ name: 'id', description: 'Report UUID' })
  @ApiResponse({
    status: 200,
    description: 'PDF file',
    content: {
      'application/pdf': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Report not found or PDF not available' })
  async downloadReport(
    @Param('id', UuidValidationPipe) id: string,
    @Res() res: Response,
    @Req() req: Request,
  ): Promise<void> {
    const user = req.user as any;
    const report = await this.reportsService.findById(id, user.userId, user.role);

    if (!report.pdfUrl) {
      throw new NotFoundException('PDF not available for this report');
    }

    const filePath = path.join(process.cwd(), report.pdfUrl);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('PDF file not found');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${report.reportNumber}.pdf"`,
    );

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  }

  @Get()
  @Roles(UserRole.RECEPTIONIST, UserRole.SUPER_ADMIN, UserRole.DOCTOR, UserRole.TEST_TECHNICIAN, UserRole.LAB_TECHNICIAN)
  @ApiOperation({ summary: 'Get all reports with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'GENERATING', 'COMPLETED', 'FAILED'] })
  @ApiQuery({ name: 'dateFrom', required: false, type: String })
  @ApiQuery({ name: 'dateTo', required: false, type: String })
  @ApiQuery({ name: 'patientId', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of reports',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/ReportResponseDto' },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  async getAllReports(
    @Query() queryDto: QueryReportsDto,
    @Req() req: Request,
  ): Promise<{
    data: ReportResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const user = req.user as any;
    return this.reportsService.findAll(queryDto, user.userId, user.role);
  }
}

