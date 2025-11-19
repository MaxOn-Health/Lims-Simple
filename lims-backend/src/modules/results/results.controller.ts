import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
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
} from '@nestjs/swagger';
import { ResultsService } from './results.service';
import { SubmitResultDto } from './dto/submit-result.dto';
import { UpdateResultDto } from './dto/update-result.dto';
import { ResultResponseDto } from './dto/result-response.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Results')
@Controller('results')
@ApiBearerAuth('JWT-auth')
@UseGuards(RolesGuard)
export class ResultsController {
  constructor(private readonly resultsService: ResultsService) {}

  @Post('submit')
  @Roles(UserRole.TEST_TECHNICIAN, UserRole.LAB_TECHNICIAN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit test result (TEST_TECHNICIAN, LAB_TECHNICIAN only)' })
  @ApiResponse({
    status: 201,
    description: 'Result submitted successfully',
    type: ResultResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error or assignment not in COMPLETED status' })
  @ApiResponse({ status: 403, description: 'Forbidden - TEST_TECHNICIAN or LAB_TECHNICIAN only, or assignment does not belong to user' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  async submitResult(
    @Body() submitResultDto: SubmitResultDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ResultResponseDto> {
    return this.resultsService.submitResult(submitResultDto, user.userId);
  }

  @Get('assignment/:assignmentId')
  @ApiOperation({ summary: 'Get result by assignment ID (All authenticated users)' })
  @ApiParam({ name: 'assignmentId', description: 'Assignment UUID' })
  @ApiResponse({
    status: 200,
    description: 'Result details',
    type: ResultResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Result not found' })
  async findByAssignment(@Param('assignmentId') assignmentId: string): Promise<ResultResponseDto> {
    return this.resultsService.findByAssignment(assignmentId);
  }

  @Get('patient/:patientId')
  @ApiOperation({ summary: 'Get all results for a patient (All authenticated users)' })
  @ApiParam({ name: 'patientId', description: 'Patient UUID' })
  @ApiResponse({
    status: 200,
    description: 'List of results for patient',
    type: [ResultResponseDto],
  })
  async findByPatient(@Param('patientId') patientId: string): Promise<ResultResponseDto[]> {
    return this.resultsService.findByPatient(patientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get result by ID (All authenticated users)' })
  @ApiParam({ name: 'id', description: 'Result UUID' })
  @ApiResponse({
    status: 200,
    description: 'Result details',
    type: ResultResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Result not found' })
  async findOne(@Param('id') id: string): Promise<ResultResponseDto> {
    return this.resultsService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update result (SUPER_ADMIN only)' })
  @ApiParam({ name: 'id', description: 'Result UUID' })
  @ApiResponse({
    status: 200,
    description: 'Result updated successfully',
    type: ResultResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
  @ApiResponse({ status: 404, description: 'Result not found' })
  async updateResult(
    @Param('id') id: string,
    @Body() updateResultDto: UpdateResultDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ResultResponseDto> {
    return this.resultsService.updateResult(id, updateResultDto, user.userId);
  }

  @Post(':id/verify')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Verify result (SUPER_ADMIN only)' })
  @ApiParam({ name: 'id', description: 'Result UUID' })
  @ApiResponse({
    status: 200,
    description: 'Result verified successfully',
    type: ResultResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
  @ApiResponse({ status: 404, description: 'Result not found' })
  async verifyResult(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ResultResponseDto> {
    return this.resultsService.verifyResult(id, user.userId);
  }
}

