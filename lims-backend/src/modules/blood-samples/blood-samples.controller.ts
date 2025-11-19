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
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { BloodSamplesService } from './blood-samples.service';
import { RegisterBloodSampleDto } from './dto/register-blood-sample.dto';
import { AccessBloodSampleDto } from './dto/access-blood-sample.dto';
import { UpdateBloodSampleStatusDto } from './dto/update-blood-sample-status.dto';
import { SubmitBloodTestResultDto } from './dto/submit-blood-test-result.dto';
import { BloodSampleResponseDto, RegisterBloodSampleResponseDto } from './dto/blood-sample-response.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UuidParamGuard } from '../../common/guards/uuid-param.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { BloodSampleStatus } from './constants/blood-sample-status.enum';
import { UuidValidationPipe } from '../../common/pipes/uuid-validation.pipe';

@ApiTags('Blood Samples')
@Controller('blood-samples')
@ApiBearerAuth('JWT-auth')
@UseGuards(RolesGuard)
export class BloodSamplesController {
  constructor(private readonly bloodSamplesService: BloodSamplesService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all blood samples (SUPER_ADMIN only)' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: BloodSampleStatus,
    description: 'Filter by sample status',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all blood samples',
    type: [BloodSampleResponseDto],
  })
  async getAllSamples(
    @Query('status') status: BloodSampleStatus,
  ): Promise<BloodSampleResponseDto[]> {
    return this.bloodSamplesService.findAll(status);
  }

  @Get('my-samples')
  @Roles(UserRole.LAB_TECHNICIAN)
  @ApiOperation({ summary: 'Get all samples accessed by current lab technician' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: BloodSampleStatus,
    description: 'Filter by sample status',
  })
  @ApiResponse({
    status: 200,
    description: 'List of samples accessed by current user',
    type: [BloodSampleResponseDto],
  })
  async getMySamples(
    @Query('status') status: BloodSampleStatus,
    @CurrentUser() user: JwtPayload,
  ): Promise<BloodSampleResponseDto[]> {
    return this.bloodSamplesService.findMySamples(user.userId, status);
  }

  @Post('register')
  @Roles(UserRole.RECEPTIONIST, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new blood sample (RECEPTIONIST, SUPER_ADMIN only)' })
  @ApiResponse({
    status: 201,
    description: 'Blood sample registered successfully',
    type: RegisterBloodSampleResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Forbidden - RECEPTIONIST or SUPER_ADMIN only' })
  @ApiResponse({ status: 404, description: 'Patient not found or blood test not found' })
  async registerBloodSample(
    @Body() registerDto: RegisterBloodSampleDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<RegisterBloodSampleResponseDto> {
    return this.bloodSamplesService.registerBloodSample(registerDto, user.userId);
  }

  @Post('access')
  @Roles(UserRole.LAB_TECHNICIAN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Access blood sample with passcode (LAB_TECHNICIAN only)' })
  @ApiResponse({
    status: 200,
    description: 'Sample accessed successfully',
    type: BloodSampleResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid sample status' })
  @ApiResponse({ status: 403, description: 'Invalid passcode or forbidden' })
  @ApiResponse({ status: 404, description: 'Sample not found' })
  async accessBloodSample(
    @Body() accessDto: AccessBloodSampleDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<BloodSampleResponseDto> {
    return this.bloodSamplesService.accessBloodSample(accessDto, user.userId);
  }

  @Put(':id/status')
  @Roles(UserRole.LAB_TECHNICIAN)
  @ApiOperation({ summary: 'Update blood sample status (LAB_TECHNICIAN only)' })
  @ApiParam({ name: 'id', description: 'Blood sample UUID' })
  @ApiResponse({
    status: 200,
    description: 'Status updated successfully',
    type: BloodSampleResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 403, description: 'Forbidden - LAB_TECHNICIAN only' })
  @ApiResponse({ status: 404, description: 'Sample not found' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStatusDto: UpdateBloodSampleStatusDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<BloodSampleResponseDto> {
    return this.bloodSamplesService.updateStatus(id, updateStatusDto, user.userId);
  }

  @Get(':id')
  @UseGuards(UuidParamGuard)
  @ApiOperation({ summary: 'Get blood sample by ID (LAB_TECHNICIAN if accessed, SUPER_ADMIN)' })
  @ApiParam({ name: 'id', description: 'Blood sample UUID' })
  @ApiResponse({
    status: 200,
    description: 'Sample details',
    type: BloodSampleResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID format' })
  @ApiResponse({ status: 403, description: 'Forbidden - no access to this sample' })
  @ApiResponse({ status: 404, description: 'Sample not found' })
  async getById(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<BloodSampleResponseDto> {
    // Validate UUID format before calling service
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new BadRequestException(`Invalid UUID format: ${id}`);
    }
    return this.bloodSamplesService.findById(id, user.userId);
  }

  @Post(':id/results')
  @Roles(UserRole.LAB_TECHNICIAN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit blood test result (LAB_TECHNICIAN only)' })
  @ApiParam({ name: 'id', description: 'Blood sample UUID' })
  @ApiResponse({
    status: 201,
    description: 'Result submitted successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation error or invalid sample status' })
  @ApiResponse({ status: 403, description: 'Forbidden - must access sample with passcode first' })
  @ApiResponse({ status: 404, description: 'Sample or assignment not found' })
  async submitBloodTestResult(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() submitDto: SubmitBloodTestResultDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<any> {
    return this.bloodSamplesService.submitBloodTestResult(id, submitDto, user.userId);
  }
}

